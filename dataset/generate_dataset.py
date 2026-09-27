"""
SecureChain AI - Dataset Generator
Generates a simulated supply chain behavior dataset for anomaly detection training.
Features represent runtime behavior metrics of software packages.
"""

import csv
import random
import os

random.seed(42)

HEADERS = [
    "package_name", "version", "api_calls_per_min",
    "file_access_count", "network_requests", "cpu_usage_pct",
    "memory_mb", "outbound_connections", "subprocess_spawns",
    "env_variable_reads", "label"
]

BENIGN_PACKAGES = [
    "requests", "numpy", "pandas", "flask", "django",
    "sqlalchemy", "boto3", "pydantic", "fastapi", "aiohttp",
    "httpx", "click", "rich", "loguru", "pytest"
]

MALICIOUS_PACKAGES = [
    "requestss", "numpyy", "pandaas", "flaask", "djangoo",
    "sqlalchemyy", "botto3", "pydanticc", "fast-api", "aio-http"
]

rows = []

# Generate benign samples
for _ in range(400):
    pkg = random.choice(BENIGN_PACKAGES)
    row = {
        "package_name": pkg,
        "version": f"{random.randint(1,4)}.{random.randint(0,9)}.{random.randint(0,9)}",
        "api_calls_per_min": random.randint(5, 80),
        "file_access_count": random.randint(1, 30),
        "network_requests": random.randint(0, 20),
        "cpu_usage_pct": round(random.uniform(0.5, 15.0), 2),
        "memory_mb": random.randint(10, 200),
        "outbound_connections": random.randint(0, 5),
        "subprocess_spawns": random.randint(0, 2),
        "env_variable_reads": random.randint(0, 10),
        "label": 0  # benign
    }
    rows.append(row)

# Generate malicious/anomalous samples
for _ in range(100):
    pkg = random.choice(MALICIOUS_PACKAGES)
    row = {
        "package_name": pkg,
        "version": f"{random.randint(0,1)}.{random.randint(0,3)}.{random.randint(0,5)}",
        "api_calls_per_min": random.randint(200, 800),
        "file_access_count": random.randint(100, 500),
        "network_requests": random.randint(50, 300),
        "cpu_usage_pct": round(random.uniform(40.0, 95.0), 2),
        "memory_mb": random.randint(400, 1200),
        "outbound_connections": random.randint(10, 50),
        "subprocess_spawns": random.randint(5, 30),
        "env_variable_reads": random.randint(20, 80),
        "label": 1  # malicious
    }
    rows.append(row)

random.shuffle(rows)

output_path = os.path.join(os.path.dirname(__file__), "supply_chain_behavior.csv")
with open(output_path, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=HEADERS)
    writer.writeheader()
    writer.writerows(rows)

print(f"Dataset generated: {len(rows)} samples -> {output_path}")
