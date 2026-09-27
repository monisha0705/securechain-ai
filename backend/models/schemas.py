"""
models/schemas.py - Pydantic v2 request/response schemas for SecureChain AI.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ─── Dependency ───────────────────────────────────────────────────────────────

class DependencyInfo(BaseModel):
    name: str
    version: str
    normalized_version: str


# ─── Vulnerability ────────────────────────────────────────────────────────────

class VulnerabilityDetail(BaseModel):
    cve_id: str
    summary: str
    severity: str          # CRITICAL / HIGH / MEDIUM / LOW / UNKNOWN
    cvss_score: Optional[float] = None
    published: Optional[str] = None
    references: List[str] = []


class PackageVulnResult(BaseModel):
    package: str
    version: str
    vulnerabilities: List[VulnerabilityDetail]
    vuln_count: int


# ─── Anomaly ──────────────────────────────────────────────────────────────────

class AnomalyRecord(BaseModel):
    package_name: str
    version: str
    anomaly_score: float      # raw Isolation Forest decision score (negated)
    is_anomaly: bool
    risk_factors: Dict[str, Any] = {}


class AnomalyResult(BaseModel):
    records: List[AnomalyRecord]
    total_anomalies: int
    model_used: str = "IsolationForest"


# ─── Risk Engine ──────────────────────────────────────────────────────────────

class RiskAssessment(BaseModel):
    score: float = Field(..., ge=0, le=100)
    label: str              # Safe / Moderate / High
    breakdown: Dict[str, float]  # sub-scores per category


# ─── Scan Response ────────────────────────────────────────────────────────────

class ScanResponse(BaseModel):
    scan_id: str
    filename: str
    dependencies: List[DependencyInfo]
    vulnerabilities: List[PackageVulnResult]
    anomalies: AnomalyResult
    risk: RiskAssessment
    summary: Dict[str, Any]
    scanned_at: str


class UploadResponse(BaseModel):
    scan_id: str
    filename: str
    message: str
    package_count: int


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
