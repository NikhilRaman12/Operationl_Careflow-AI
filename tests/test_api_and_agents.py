import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app import app
from backend.crew_runner import run_pipeline

client = TestClient(app)


def test_pipeline_runs_and_generates_all_5_artifacts():
    res = run_pipeline({"location_key": "US"})
    assert res["summary"] == "CareFlow artifacts generated successfully."
    assert "agent_execution_trace" in res["outputs"]
    assert "decision_summary" in res["outputs"]
    assert "executive_report" in res["outputs"]
    assert "google_covid_kpis" in res["outputs"]
    assert "gpu_benchmark" in res["outputs"]

    for path in res["outputs"].values():
        assert Path(path).exists()


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "artifacts" in data


def test_summary_endpoint():
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"SUCCESS", "MISSING"}


def test_agents_status_endpoint():
    response = client.get("/api/agents/status")
    assert response.status_code == 200
    data = response.json()
    if data.get("status") != "MISSING":
        assert data["total_agents"] == 9
        assert data["verified_agents"] == 9


def test_run_pipeline_endpoint():
    response = client.post("/api/run-pipeline", json={"location_key": "US"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "outputs" in data
