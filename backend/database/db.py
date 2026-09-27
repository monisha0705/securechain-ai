"""
database/db.py - Async SQLite database setup via SQLAlchemy
Uses aiosqlite for async operations with SQLite fallback (PostgreSQL-ready).
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
import os

# SQLite async URL (swap for postgresql+asyncpg://... in production)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./securechain.db")

engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


class ScanResult(Base):
    """Persisted scan result for a requirements.txt upload."""
    __tablename__ = "scan_results"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(String(64), unique=True, index=True)
    filename = Column(String(255))
    total_packages = Column(Integer, default=0)
    total_vulnerabilities = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_label = Column(String(20), default="Safe")
    anomaly_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    raw_json = Column(Text)  # Full result payload stored as JSON string


async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session():
    """Dependency-injectable async session."""
    async with AsyncSessionLocal() as session:
        yield session
