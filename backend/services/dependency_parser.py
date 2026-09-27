"""
services/dependency_parser.py
Parses requirements.txt content into structured DependencyInfo objects.
Handles: pinned (==), range (>=, <=), unpinned, extras, comments, editable installs.
"""

import re
from typing import List
from models.schemas import DependencyInfo
import logging

logger = logging.getLogger(__name__)

# Regex: capture package name and optional version specifier
_REQ_RE = re.compile(
    r"^\s*"
    r"(?P<name>[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?)"
    r"(?:\[.*?\])?"                         # optional extras [security]
    r"(?P<spec>[^;#\n]*)?"                  # version specifier
    r"(?:[;#].*)?\s*$"
)


def _normalize_version(spec: str) -> str:
    """Extract the most meaningful version string from a specifier."""
    spec = spec.strip()
    if not spec:
        return "unspecified"
    # Prefer pinned == version
    pinned = re.search(r"==\s*([\w.]+)", spec)
    if pinned:
        return pinned.group(1)
    # Otherwise return the full specifier cleaned up
    return spec.lstrip("=<>!~").split(",")[0].strip() or "unspecified"


def parse_requirements(content: str) -> List[DependencyInfo]:
    """
    Parse a requirements.txt string and return a list of DependencyInfo.

    Args:
        content: raw text of requirements.txt

    Returns:
        List of DependencyInfo with name, raw version spec, normalized version
    """
    deps: List[DependencyInfo] = []
    seen = set()

    for lineno, raw_line in enumerate(content.splitlines(), start=1):
        line = raw_line.strip()

        # Skip blanks, comments, editable installs, URLs
        if not line or line.startswith("#") or line.startswith("-e") or "://" in line:
            continue

        match = _REQ_RE.match(line)
        if not match:
            logger.warning("Line %d could not be parsed: %r", lineno, line)
            continue

        name = match.group("name").lower().replace("_", "-")
        spec = (match.group("spec") or "").strip()
        norm_ver = _normalize_version(spec)

        if name in seen:
            logger.debug("Duplicate package skipped: %s", name)
            continue
        seen.add(name)

        deps.append(DependencyInfo(
            name=name,
            version=spec if spec else "unspecified",
            normalized_version=norm_ver,
        ))

    logger.info("Parsed %d unique packages", len(deps))
    return deps
