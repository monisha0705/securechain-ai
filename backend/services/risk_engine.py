"""
services/risk_engine.py

Composite Risk Scoring Engine for SecureChain AI.

Combines vulnerability data and anomaly detection results into a single
0–100 risk score with a Safe / Moderate / High label.

Scoring Breakdown (weights sum to 100):
  - Vulnerability sub-score  : 55 pts  (severity-weighted CVE counts)
  - Anomaly sub-score        : 30 pts  (Isolation Forest detection rate)
  - Package hygiene sub-score: 15 pts  (unversioned / typosquatting signals)
"""

import logging
from typing import List
from models.schemas import (
    PackageVulnResult, AnomalyResult, RiskAssessment, DependencyInfo
)

logger = logging.getLogger(__name__)

# Severity weights for vulnerability scoring
SEVERITY_WEIGHTS = {
    "CRITICAL": 10.0,
    "HIGH":      6.0,
    "MEDIUM":    3.0,
    "LOW":       1.0,
    "UNKNOWN":   2.0,
}

# Risk label thresholds
LABEL_THRESHOLDS = [
    (70, "High"),
    (35, "Moderate"),
    (0,  "Safe"),
]


def _vuln_sub_score(vuln_results: List[PackageVulnResult], total_packages: int) -> float:
    """
    Compute a 0–55 vulnerability sub-score.
    Weighted by severity counts, normalised against package count.
    """
    if total_packages == 0:
        return 0.0

    weighted_sum = 0.0
    for pkg in vuln_results:
        for vuln in pkg.vulnerabilities:
            weighted_sum += SEVERITY_WEIGHTS.get(vuln.severity, 2.0)

    # Cap at a sensible ceiling: 3 CRITICAL vulns per package = max score
    ceiling = total_packages * SEVERITY_WEIGHTS["CRITICAL"] * 3
    raw = min(weighted_sum / ceiling, 1.0) if ceiling > 0 else 0.0
    return round(raw * 55, 2)


def _anomaly_sub_score(anomaly_result: AnomalyResult, total_packages: int) -> float:
    """
    Compute a 0–30 anomaly sub-score based on detection rate and scores.
    """
    if total_packages == 0 or not anomaly_result.records:
        return 0.0

    detection_rate = anomaly_result.total_anomalies / total_packages
    avg_score = sum(r.anomaly_score for r in anomaly_result.records) / len(anomaly_result.records)

    # Blend rate and avg score
    blended = (detection_rate * 0.7) + (avg_score * 0.3)
    return round(min(blended, 1.0) * 30, 2)


def _hygiene_sub_score(deps: List[DependencyInfo]) -> float:
    """
    Compute a 0–15 hygiene sub-score.
    Penalises: unversioned packages, suspicious naming patterns.
    """
    if not deps:
        return 0.0

    penalty = 0.0
    for dep in deps:
        if dep.normalized_version == "unspecified":
            penalty += 1.5
        # Typosquatting signals: double letters, trailing digits, known misspellings
        name = dep.name
        if any(name.endswith(s) for s in ("2", "3", "x", "xx")):
            penalty += 1.0
        if len(name) <= 3:
            penalty += 2.0

    ceiling = len(deps) * 3.0
    raw = min(penalty / ceiling, 1.0) if ceiling > 0 else 0.0
    return round(raw * 15, 2)


def compute_risk(
    deps: List[DependencyInfo],
    vuln_results: List[PackageVulnResult],
    anomaly_result: AnomalyResult,
) -> RiskAssessment:
    """
    Compute the final composite risk score and label.

    Returns:
        RiskAssessment with score (0–100), label, and sub-score breakdown.
    """
    total = len(deps)

    v_score = _vuln_sub_score(vuln_results, total)
    a_score = _anomaly_sub_score(anomaly_result, total)
    h_score = _hygiene_sub_score(deps)

    composite = min(round(v_score + a_score + h_score, 2), 100.0)

    label = "Safe"
    for threshold, lbl in LABEL_THRESHOLDS:
        if composite >= threshold:
            label = lbl
            break

    logger.info(
        "Risk score: %.1f (%s) | vuln=%.1f anomaly=%.1f hygiene=%.1f",
        composite, label, v_score, a_score, h_score,
    )

    return RiskAssessment(
        score=composite,
        label=label,
        breakdown={
            "vulnerability_score": v_score,
            "anomaly_score": a_score,
            "hygiene_score": h_score,
        },
    )
