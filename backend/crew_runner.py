import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT_DIR / "src"
OUTPUTS_DIR = ROOT_DIR / "outputs"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from operational_careflow_ai___intelligence_layer.crew import OperationalCareflowAiIntelligenceLayerCrew

load_dotenv(ROOT_DIR / ".env")


def default_inputs() -> dict[str, Any]:
    return {
        "location_key": os.getenv("LOCATION_KEY", "US"),
        "data_file_path": os.getenv("DATA_FILE_PATH", ""),
        "total_icu_capacity": int(os.getenv("TOTAL_ICU_CAPACITY", "50")),
        "total_ventilators": int(os.getenv("TOTAL_VENTILATORS", "20")),
        "total_bed_capacity": int(os.getenv("TOTAL_BED_CAPACITY", "200")),
    }


def run_pipeline(inputs: dict[str, Any] | None = None) -> dict[str, Any]:
    pipeline_inputs = default_inputs()
    if inputs:
        pipeline_inputs.update({key: value for key, value in inputs.items() if value is not None})
    return OperationalCareflowAiIntelligenceLayerCrew().build_submission_artifacts(pipeline_inputs)
