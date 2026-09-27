"""
services/anomaly_detector.py

AI-based anomaly detection using Scikit-learn's Isolation Forest algorithm.

Why Isolation Forest?
- Unsupervised: no labelled attack data required for inference
- Handles high-dimensional tabular data efficiently
- Produces anomaly scores, not just binary labels
- Robust to outliers in training data (ideal for supply chain scenarios)
- O(n log n) training complexity — scales well

The model is trained on a simulated dataset of package runtime behaviors
(CPU, memory, network, file access, subprocess spawns, etc.) and assigns
anomaly scores to submitted packages based on their behavioral fingerprint.
"""

import os
import numpy as np
import pandas as pd
import logging
from typing import List, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from models.schemas import DependencyInfo, AnomalyRecord, AnomalyResult

logger = logging.getLogger(__name__)

# ─── Dataset & Feature Config ─────────────────────────────────────────────────

DATASET_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "dataset", "supply_chain_behavior.csv"
)

FEATURE_COLS = [
    "api_calls_per_min",
    "file_access_count",
    "network_requests",
    "cpu_usage_pct",
    "memory_mb",
    "outbound_connections",
    "subprocess_spawns",
    "env_variable_reads",
]

# Contamination = expected fraction of anomalies in production traffic
CONTAMINATION = 0.15
RANDOM_STATE = 42


class AnomalyDetector:
    """
    Singleton-style detector that trains once on startup and reuses the model.
    """

    def __init__(self):
        self._model: IsolationForest | None = None
        self._scaler: StandardScaler | None = None
        self._df: pd.DataFrame | None = None

    # ── Training ──────────────────────────────────────────────────────────────

    def _load_dataset(self) -> pd.DataFrame:
        """Load the simulated behavior dataset."""
        path = os.path.abspath(DATASET_PATH)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Dataset not found at {path}. Run dataset/generate_dataset.py first.")
        df = pd.read_csv(path)
        logger.info("Loaded dataset: %d rows from %s", len(df), path)
        return df

    def train(self) -> None:
        """Train IsolationForest on the simulated dataset."""
        self._df = self._load_dataset()
        X = self._df[FEATURE_COLS].fillna(0).values

        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        self._model = IsolationForest(
            n_estimators=200,
            contamination=CONTAMINATION,
            max_samples="auto",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
        self._model.fit(X_scaled)
        logger.info("IsolationForest trained on %d samples with %d features", len(X), len(FEATURE_COLS))

    # ── Inference ─────────────────────────────────────────────────────────────

    def _simulate_features(self, name: str, version: str) -> np.ndarray:
        """
        Simulate runtime features for a package.
        In a production system this would be replaced with live telemetry.
        Uses package name/version hash to create deterministic but varied values.
        """
        rng = np.random.default_rng(abs(hash(f"{name}:{version}")) % (2**32))

        # Typosquatting heuristic: very short name or ends with common suffixes
        is_suspicious = (
            len(name) <= 4
            or name.endswith(("2", "3", "py", "lib"))
            or any(name.startswith(k) for k in ["test-", "dev-", "tmp-"])
        )

        if is_suspicious:
            # Anomalous profile
            return rng.uniform([150, 80, 40, 35, 350, 8, 4, 15],
                               [700, 400, 250, 90, 1100, 45, 28, 75]).reshape(1, -1)
        else:
            # Normal profile
            return rng.uniform([5, 1, 0, 0.5, 10, 0, 0, 0],
                               [80, 30, 20, 15, 200, 5, 2, 10]).reshape(1, -1)

    def analyze(self, deps: List[DependencyInfo]) -> AnomalyResult:
        """
        Analyze a list of dependencies and return anomaly detection results.
        """
        if self._model is None or self._scaler is None:
            raise RuntimeError("Model not trained. Call train() first.")

        records: List[AnomalyRecord] = []

        for dep in deps:
            feat = self._simulate_features(dep.name, dep.normalized_version)
            feat_scaled = self._scaler.transform(feat)

            # decision_function returns negative scores — more negative = more anomalous
            raw_score = float(self._model.decision_function(feat_scaled)[0])
            prediction = int(self._model.predict(feat_scaled)[0])  # -1 anomaly, 1 normal

            # Normalize to 0–1 range (higher = more anomalous)
            anomaly_score = max(0.0, min(1.0, (-raw_score + 0.5) / 1.0))
            is_anomaly = prediction == -1

            risk_factors = {
                "api_calls_per_min": round(float(feat[0][0]), 1),
                "file_access_count": round(float(feat[0][1]), 1),
                "network_requests": round(float(feat[0][2]), 1),
                "cpu_usage_pct": round(float(feat[0][3]), 2),
                "memory_mb": round(float(feat[0][4]), 1),
                "outbound_connections": round(float(feat[0][5]), 1),
                "subprocess_spawns": round(float(feat[0][6]), 1),
                "env_variable_reads": round(float(feat[0][7]), 1),
            }

            records.append(AnomalyRecord(
                package_name=dep.name,
                version=dep.normalized_version,
                anomaly_score=round(anomaly_score, 4),
                is_anomaly=is_anomaly,
                risk_factors=risk_factors,
            ))

        anomaly_count = sum(1 for r in records if r.is_anomaly)
        logger.info("Anomaly detection: %d/%d packages flagged", anomaly_count, len(records))

        return AnomalyResult(
            records=records,
            total_anomalies=anomaly_count,
            model_used="IsolationForest (n_estimators=200, contamination=0.15)",
        )


# ─── Module-level singleton ───────────────────────────────────────────────────

detector = AnomalyDetector()
