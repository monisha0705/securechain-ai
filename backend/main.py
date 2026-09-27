"""
main.py - SecureChain AI FastAPI Application Entry Point

Startup sequence:
  1. Initialise SQLite/PostgreSQL database tables
  2. Train Isolation Forest anomaly detection model
  3. Mount API routes with CORS for React frontend
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database.db import init_db
from routes.scan import router
from services.anomaly_detector import detector

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("securechain")


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("=" * 60)
    logger.info("  SecureChain AI  — Starting up")
    logger.info("=" * 60)

    # 1. Init database
    await init_db()
    logger.info("✓ Database initialised")

    # 2. Train anomaly detection model
    detector.train()
    logger.info("✓ IsolationForest model trained")

    logger.info("✓ SecureChain AI ready")
    yield

    # Shutdown
    logger.info("SecureChain AI shutting down…")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SecureChain AI",
    description=(
        "AI-Powered Supply Chain Attack Detection System. "
        "Combines OSV vulnerability data with ML-based anomaly detection "
        "to produce composite risk scores for Python dependency trees."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ✅ ADD THIS BELOW
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allows frontend (localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React dev server
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───────────────────────────────────────────────────────────────────

app.include_router(router, prefix="/api/v1")


# ─── Root ─────────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({
        "service": "SecureChain AI",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    })


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
