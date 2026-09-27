# 🛡️ SecureChain AI
### AI-Based Supply Chain Attack Detection System

> **Research-grade · Production-ready · Full-stack**

A complete system for detecting software supply chain attacks using real vulnerability data, machine learning anomaly detection, and a modern dashboard UI.

---

## 📋 Table of Contents

- [System Architecture](#-system-architecture)
- [Module Descriptions](#-module-descriptions)
- [Why Isolation Forest](#-why-isolation-forest)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Sample Outputs](#-sample-outputs)
- [Dataset](#-dataset)
- [Research Notes](#-research-notes)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React.js)                      │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Upload   │  │ Summary    │  │  Charts  │  │  Tables     │  │
│  │ Dropzone │  │ Cards KPI  │  │ Pie+Bar  │  │ Deps+CVEs   │  │
│  └────┬─────┘  └────────────┘  └──────────┘  └─────────────┘  │
│       │         Axios / REST API (CORS)                         │
└───────┼─────────────────────────────────────────────────────────┘
        │ HTTP
┌───────▼─────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Python)                    │
│                                                                  │
│  POST /upload → Dependency Parser                               │
│        │        (requirements.txt → DependencyInfo[])           │
│        ▼                                                         │
│  POST /scan  → ┌─────────────────┐  ┌─────────────────────┐   │
│                │  Vuln Checker   │  │  Anomaly Detector   │   │
│                │  OSV API v1     │  │  IsolationForest    │   │
│                │  (async batch)  │  │  (sklearn, n=200)   │   │
│                └────────┬────────┘  └──────────┬──────────┘   │
│                         └──────────┬───────────┘              │
│                              ┌─────▼──────┐                   │
│                              │ Risk Engine│                   │
│                              │  0–100 pts │                   │
│                              └─────┬──────┘                   │
│                                    ▼                           │
│                              SQLite / PostgreSQL               │
└─────────────────────────────────────────────────────────────────┘
        │ OSV API (https://api.osv.dev)
┌───────▼───────────┐
│  External APIs    │
│  osv.dev/v1/query │
└───────────────────┘
```

### Data Flow

1. **User uploads** `requirements.txt` via drag-and-drop → `POST /api/v1/upload`
2. **Dependency Parser** extracts package names + versions → returns `scan_id`
3. **Full Scan** `POST /api/v1/scan/{scan_id}` triggers:
   - Async OSV API queries for each package (rate-limited, parallel)
   - Isolation Forest inference on simulated behavioral features
   - Risk score computation (weighted: vulns 55% + anomaly 30% + hygiene 15%)
4. **Results persisted** to database, returned as JSON to frontend
5. **Dashboard renders** summary cards, charts, tables, risk gauge

---

## 📦 Module Descriptions

### `services/dependency_parser.py`
Parses `requirements.txt` into structured objects. Handles pinned versions (`==`), range specs (`>=`), extras (`[security]`), comments, editable installs, and URL dependencies. Normalises package names to lowercase hyphenated form (PEP 503).

### `services/vulnerability_checker.py`
Asynchronously queries the [OSV (Open Source Vulnerability)](https://osv.dev) database for each package. Uses `httpx` with HTTP/2 support and a semaphore-based concurrency limit. Extracts CVE IDs, CVSS scores, severity labels, and references from raw OSV JSON responses.

### `services/anomaly_detector.py`
Trains an Isolation Forest on the simulated behavioral dataset at startup. At inference time, it generates deterministic (hash-based) behavioral feature vectors per package and runs them through the trained model, producing normalised anomaly scores (0–1).

### `services/risk_engine.py`
Combines vulnerability and anomaly results into a single composite 0–100 score using a weighted breakdown:
- **Vulnerability sub-score (55 pts):** severity-weighted CVE counts normalised by package count
- **Anomaly sub-score (30 pts):** blend of detection rate and average anomaly score
- **Hygiene sub-score (15 pts):** penalties for unversioned packages and naming anomalies

### `routes/scan.py`
REST endpoints with FastAPI dependency injection, Pydantic validation, and SQLAlchemy async persistence. Includes upload caching, full scan orchestration, anomaly-only analysis, result retrieval, and scan history.

### `database/db.py`
Async SQLAlchemy setup with SQLite (aiosqlite) default and PostgreSQL-ready URL configuration. Stores scan metadata and full JSON payloads for audit and retrieval.

---

## 🤖 Why Isolation Forest?

Isolation Forest (Liu et al., 2008) is chosen for this system for several reasons:

| Property | Why it matters for supply chain security |
|---|---|
| **Unsupervised** | No labelled attack data required — new attack patterns are detectable |
| **Anomaly score output** | Produces continuous scores (not just binary), enabling risk grading |
| **High-dimensional** | Handles 8+ behavioral features without curse of dimensionality |
| **Fast inference** | O(n log n) training, O(log n) prediction — suitable for real-time scanning |
| **Robust to noise** | Designed to handle mixed clean/contaminated training data |
| **Explainable** | Feature importance can be derived from tree structure |

The algorithm isolates anomalies by randomly selecting features and split values. Anomalous samples (malicious packages with unusual behavior) require fewer splits to isolate — they have shorter average path lengths in the forest.

> **Note:** The behavioral dataset is **simulated** for research/demo purposes. In production, this would be replaced with real runtime telemetry from package sandbox execution.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Python 3.11+ + FastAPI + Uvicorn |
| AI/ML | Scikit-learn (IsolationForest + StandardScaler) |
| Database | SQLite (aiosqlite) / PostgreSQL-ready |
| External API | OSV (Open Source Vulnerabilities) — free, no key |
| HTTP Client | httpx (async, HTTP/2) |
| Validation | Pydantic v2 |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Clone & Setup

```bash
git clone https://github.com/yourname/securechain-ai.git
cd securechain-ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate training dataset
cd ../dataset && python generate_dataset.py && cd ../backend

# Start backend (auto-trains model on startup)
python main.py
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

### 4. Run a Scan

1. Open `http://localhost:3000`
2. Drag and drop `sample_requirements.txt` from the project root
3. Wait ~10–30 seconds for OSV API queries
4. Explore the full dashboard!

### Using PostgreSQL (optional)

```bash
# Set env var before starting backend:
export DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/securechain"
```

---

## 📡 API Reference

### `POST /api/v1/upload`
Upload a `requirements.txt` file.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "scan_id": "3f2a1b4c-...",
  "filename": "requirements.txt",
  "message": "File uploaded successfully. 22 packages found.",
  "package_count": 22
}
```

### `POST /api/v1/scan/{scan_id}`
Run full scan (vulnerabilities + anomaly detection + risk scoring).

**Response:**
```json
{
  "scan_id": "3f2a1b4c-...",
  "filename": "requirements.txt",
  "dependencies": [
    { "name": "requests", "version": "==2.25.1", "normalized_version": "2.25.1" }
  ],
  "vulnerabilities": [
    {
      "package": "pillow",
      "version": "8.2.0",
      "vuln_count": 3,
      "vulnerabilities": [
        {
          "cve_id": "CVE-2021-27921",
          "summary": "Pillow before 8.1.1 allows attackers to cause a DoS...",
          "severity": "HIGH",
          "cvss_score": 7.5,
          "published": "2021-03-03"
        }
      ]
    }
  ],
  "anomalies": {
    "records": [
      {
        "package_name": "requestss",
        "version": "unspecified",
        "anomaly_score": 0.8423,
        "is_anomaly": true,
        "risk_factors": {
          "api_calls_per_min": 342.0,
          "outbound_connections": 18.0
        }
      }
    ],
    "total_anomalies": 3,
    "model_used": "IsolationForest (n_estimators=200, contamination=0.15)"
  },
  "risk": {
    "score": 68.4,
    "label": "Moderate",
    "breakdown": {
      "vulnerability_score": 42.1,
      "anomaly_score": 18.5,
      "hygiene_score": 7.8
    }
  },
  "summary": {
    "total_packages": 22,
    "vulnerable_packages": 5,
    "total_vulnerabilities": 11,
    "anomalous_packages": 3,
    "severity_distribution": {
      "CRITICAL": 1, "HIGH": 4, "MEDIUM": 5, "LOW": 1, "UNKNOWN": 0
    },
    "risk_score": 68.4,
    "risk_label": "Moderate"
  },
  "scanned_at": "2024-03-22T10:30:00Z"
}
```

### `GET /api/v1/results/{scan_id}`
Retrieve persisted scan results.

### `GET /api/v1/scans`
List recent scan history (last 20 by default).

### `GET /api/v1/health`
```json
{ "status": "ok", "service": "SecureChain AI", "version": "1.0.0" }
```

---

## 📊 Sample Outputs

### Risk Score Interpretation

| Score | Label | Description |
|---|---|---|
| 0–34 | 🟢 Safe | No critical threats. Routine monitoring recommended. |
| 35–69 | 🟡 Moderate | Elevated risk. Review flagged packages before deployment. |
| 70–100 | 🔴 High | Critical supply chain risk. Immediate remediation required. |

### Severity Distribution (example)

```
CRITICAL  ████░░░░░░  1 CVE
HIGH      ████████░░  4 CVEs
MEDIUM    ██████████  5 CVEs
LOW       ██░░░░░░░░  1 CVE
```

---

## 📁 Dataset

**File:** `dataset/supply_chain_behavior.csv`

**Schema:**

| Column | Type | Description |
|---|---|---|
| `package_name` | string | Package identifier |
| `version` | string | Semantic version |
| `api_calls_per_min` | float | API call frequency |
| `file_access_count` | int | Filesystem operations |
| `network_requests` | int | Outbound HTTP requests |
| `cpu_usage_pct` | float | CPU utilisation % |
| `memory_mb` | int | Peak memory usage |
| `outbound_connections` | int | Unique outbound TCP connections |
| `subprocess_spawns` | int | Child process creations |
| `env_variable_reads` | int | Environment variable access count |
| `label` | int | 0=benign, 1=malicious |

**Distribution:** 400 benign samples + 100 malicious = 500 total

> ⚠️ **Research Note:** This dataset is **synthetically generated** for demonstration. Benign packages show low, normally distributed values; malicious packages show high-value anomalous patterns. A production system would use real sandbox execution telemetry.

---

## 🔬 Research Notes

### Threat Model
SecureChain AI targets the following supply chain attack vectors:
- **Typosquatting:** Malicious packages mimicking popular libraries
- **Dependency confusion:** Internal package name hijacking
- **Compromised maintainer accounts:** Packages with injected malicious code
- **Version pinning attacks:** Outdated packages with known CVEs

### Limitations
1. Behavioral features are simulated — production deployment requires sandbox telemetry
2. OSV API coverage is PyPI-focused in this implementation
3. Isolation Forest requires periodic retraining as attack patterns evolve
4. No code static analysis (planned extension)

### Extensions
- SBOM (Software Bill of Materials) export
- GitHub Actions CI/CD integration
- JavaScript/npm support
- Static code analysis integration (Bandit, Semgrep)
- YARA rule-based signature matching

---

*Built for research and portfolio demonstration. SecureChain AI showcases the integration of real-world vulnerability APIs, unsupervised machine learning, and modern full-stack development for cybersecurity applications.*
