import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from backend.crew_runner import OUTPUTS_DIR, run_pipeline
from backend.schemas import HealthResponse, RunPipelineRequest, RunPipelineResponse

router = APIRouter()

ARTIFACTS = {
    "summary": OUTPUTS_DIR / "decision_summary.json",
    "google_covid_kpis": OUTPUTS_DIR / "google_covid_kpis.json",
    "gpu_benchmark": OUTPUTS_DIR / "gpu_benchmark.json",
    "executive_report": OUTPUTS_DIR / "executive_report.md",
}

MISSING_MESSAGE = "Pipeline has not been run yet. Trigger POST /api/run-pipeline to generate this artifact."


def _artifact_status() -> dict[str, dict[str, Any]]:
    return {
        name: {"exists": path.exists(), "path": str(path)}
        for name, path in ARTIFACTS.items()
    }


def _read_json_artifact(name: str) -> dict[str, Any]:
    path = ARTIFACTS[name]
    if not path.exists():
        return {
            "status": "MISSING",
            "message": MISSING_MESSAGE,
            "expected_file": str(path),
        }
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Artifact {path.name} is not valid JSON: {exc}") from exc


@router.get("/health", response_model=HealthResponse)
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "Operational CareFlow AI API",
        "artifacts": _artifact_status(),
    }


@router.get("/api/summary")
def get_summary() -> dict[str, Any]:
    return _read_json_artifact("summary")


@router.get("/api/google-covid-kpis")
def get_google_covid_kpis() -> dict[str, Any]:
    return _read_json_artifact("google_covid_kpis")


@router.get("/api/gpu-benchmark")
def get_gpu_benchmark() -> dict[str, Any]:
    return _read_json_artifact("gpu_benchmark")


@router.get("/api/executive-report", response_class=PlainTextResponse)
def get_executive_report() -> str:
    path = ARTIFACTS["executive_report"]
    if not path.exists():
        return f"{MISSING_MESSAGE}\nExpected file: {path}"
    return path.read_text(encoding="utf-8")


@router.post("/api/run-pipeline", response_model=RunPipelineResponse)
def post_run_pipeline(request: RunPipelineRequest) -> dict[str, Any]:
    result = run_pipeline(request.model_dump())
    return {
        "status": "SUCCESS",
        "message": result["summary"],
        "outputs": result["outputs"],
        "summary": _read_json_artifact("summary"),
        "google_covid_kpis": _read_json_artifact("google_covid_kpis"),
        "gpu_benchmark": _read_json_artifact("gpu_benchmark"),
    }
