from typing import Any

from pydantic import BaseModel, Field


class ArtifactStatus(BaseModel):
    exists: bool
    path: str


class HealthResponse(BaseModel):
    status: str
    service: str = "Operational CareFlow AI API"
    artifacts: dict[str, ArtifactStatus]


class MissingArtifactResponse(BaseModel):
    status: str = "MISSING"
    message: str
    expected_file: str


class RunPipelineRequest(BaseModel):
    location_key: str = Field(default="US")
    data_file_path: str = Field(default="")
    total_icu_capacity: int = Field(default=50)
    total_ventilators: int = Field(default=20)
    total_bed_capacity: int = Field(default=200)


class RunPipelineResponse(BaseModel):
    status: str
    message: str
    outputs: dict[str, str]
    summary: dict[str, Any] | None = None
    google_covid_kpis: dict[str, Any] | None = None
    gpu_benchmark: dict[str, Any] | None = None
