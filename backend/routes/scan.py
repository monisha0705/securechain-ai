"""
routes/scan.py - All API routes for SecureChain AI backend.

Endpoints:
  POST /upload    - Upload a requirements.txt file, returns scan_id
  POST /scan      - Run full dependency + vulnerability scan
  POST /analyze   - Run AI anomaly detection only
  GET  /results/{scan_id} - Retrieve persisted scan results
  GET  /health    - Liveness check
"""

import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.db import get_session, ScanResult
from models.schemas import (
    UploadResponse, ScanResponse, AnomalyResult,
    ErrorResponse, RiskAssessment,
)
from services.dependency_parser import parse_requirements
from services.vulnerability_checker import check_vulnerabilities
from services.anomaly_detector import detector
from services.risk_engine import compute_risk

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store for uploads awaiting full scan (keyed by scan_id)
_upload_cache: Dict[str, Dict[str, Any]] = {}


# ─── /health ──────────────────────────────────────────────────────────────────

@router.get("/health", tags=["System"])
async def health_check():
    """Liveness / readiness probe."""
    return {"status": "ok", "service": "SecureChain AI", "version": "1.0.0"}


# ─── /upload ──────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=UploadResponse, tags=["Scan"])
async def upload_requirements(file: UploadFile = File(...)):
    """
    Upload a requirements.txt file.
    Returns a scan_id for use in subsequent /scan calls.
    Accepts: .txt files only.
    """
    if file.content_type not in ("text/plain", "application/octet-stream") and \
       not (file.filename or "").endswith(".txt"):
        raise HTTPException(
            status_code=400,
            detail="Only .txt files are accepted (requirements.txt format).",
        )

    content_bytes = await file.read()
    try:
        content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.")

    deps = parse_requirements(content)
    if not deps:
        raise HTTPException(status_code=422, detail="No valid packages found in file.")

    scan_id = str(uuid.uuid4())
    _upload_cache[scan_id] = {
        "filename": file.filename or "requirements.txt",
        "content": content,
        "deps": deps,
    }

    logger.info("Uploaded %s → scan_id=%s (%d packages)", file.filename, scan_id, len(deps))

    return UploadResponse(
        scan_id=scan_id,
        filename=file.filename or "requirements.txt",
        message=f"File uploaded successfully. {len(deps)} packages found.",
        package_count=len(deps),
    )


# ─── /scan ────────────────────────────────────────────────────────────────────

@router.post("/scan/{scan_id}", response_model=ScanResponse, tags=["Scan"])
async def run_scan(scan_id: str, db: AsyncSession = Depends(get_session)):
    """
    Run full scan for a previously uploaded requirements file.
    Performs: dependency parsing → vulnerability check → anomaly detection → risk scoring.
    """
    cached = _upload_cache.get(scan_id)
    if not cached:
        raise HTTPException(
            status_code=404,
            detail=f"scan_id '{scan_id}' not found. Please upload a file first.",
        )

    deps = cached["deps"]
    filename = cached["filename"]

    try:
        # Step 1: Vulnerability check via OSV API
        logger.info("[%s] Checking vulnerabilities for %d packages…", scan_id, len(deps))
        vuln_results = await check_vulnerabilities(deps)

        # Step 2: AI anomaly detection
        logger.info("[%s] Running anomaly detection…", scan_id)
        anomaly_result = detector.analyze(deps)

        # Step 3: Composite risk scoring
        risk = compute_risk(deps, vuln_results, anomaly_result)

        # Step 4: Build summary
        severity_dist: Dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "UNKNOWN": 0}
        for pkg in vuln_results:
            for v in pkg.vulnerabilities:
                severity_dist[v.severity] = severity_dist.get(v.severity, 0) + 1

        total_vulns = sum(r.vuln_count for r in vuln_results)
        summary = {
            "total_packages": len(deps),
            "vulnerable_packages": sum(1 for r in vuln_results if r.vuln_count > 0),
            "total_vulnerabilities": total_vulns,
            "anomalous_packages": anomaly_result.total_anomalies,
            "severity_distribution": severity_dist,
            "risk_score": risk.score,
            "risk_label": risk.label,
        }

        scanned_at = datetime.now(timezone.utc).isoformat()

        response = ScanResponse(
            scan_id=scan_id,
            filename=filename,
            dependencies=deps,
            vulnerabilities=vuln_results,
            anomalies=anomaly_result,
            risk=risk,
            summary=summary,
            scanned_at=scanned_at,
        )

        # Persist to database
        db_record = ScanResult(
            scan_id=scan_id,
            filename=filename,
            total_packages=len(deps),
            total_vulnerabilities=total_vulns,
            risk_score=risk.score,
            risk_label=risk.label,
            anomaly_count=anomaly_result.total_anomalies,
            raw_json=response.model_dump_json(),
        )
        db.add(db_record)
        await db.commit()

        # Clean up cache
        del _upload_cache[scan_id]

        logger.info("[%s] Scan complete — risk=%.1f (%s)", scan_id, risk.score, risk.label)
        return response

    except Exception as exc:
        logger.exception("[%s] Scan failed: %s", scan_id, exc)
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(exc)}")


# ─── /analyze ─────────────────────────────────────────────────────────────────

@router.post("/analyze/{scan_id}", response_model=AnomalyResult, tags=["AI"])
async def run_anomaly_analysis(scan_id: str):
    """
    Run AI anomaly detection only (without vulnerability checking).
    Useful for quick behavioral analysis.
    """
    cached = _upload_cache.get(scan_id)
    if not cached:
        raise HTTPException(status_code=404, detail=f"scan_id '{scan_id}' not found.")

    deps = cached["deps"]
    result = detector.analyze(deps)
    return result


# ─── /results/{scan_id} ───────────────────────────────────────────────────────

@router.get("/results/{scan_id}", tags=["Results"])
async def get_results(scan_id: str, db: AsyncSession = Depends(get_session)):
    """
    Retrieve persisted scan results by scan_id.
    """
    stmt = select(ScanResult).where(ScanResult.scan_id == scan_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail=f"No results found for scan_id '{scan_id}'.")

    return json.loads(record.raw_json)


# ─── /scans (history) ─────────────────────────────────────────────────────────

@router.get("/scans", tags=["Results"])
async def list_scans(limit: int = 20, db: AsyncSession = Depends(get_session)):
    """List recent scan history (metadata only, no full JSON)."""
    stmt = select(ScanResult).order_by(ScanResult.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    records = result.scalars().all()

    return [
        {
            "scan_id": r.scan_id,
            "filename": r.filename,
            "total_packages": r.total_packages,
            "total_vulnerabilities": r.total_vulnerabilities,
            "risk_score": r.risk_score,
            "risk_label": r.risk_label,
            "anomaly_count": r.anomaly_count,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]
