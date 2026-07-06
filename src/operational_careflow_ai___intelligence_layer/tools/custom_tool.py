import json
from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class CareFlowUtilityInput(BaseModel):
    """Input schema for the CareFlow utility tool."""

    location_key: str = Field(default="US", description="Location key for the active CareFlow run")
    icu_capacity: int = Field(default=50, description="Total ICU bed capacity")
    ventilator_capacity: int = Field(default=20, description="Total ventilator capacity")
    bed_capacity: int = Field(default=200, description="Total general bed capacity")


class CareFlowUtilityTool(BaseTool):
    name: str = "CareFlowUtilityTool"
    description: str = "Formats current CareFlow capacities and location context into a compact JSON summary for the pipeline."
    args_schema: Type[BaseModel] = CareFlowUtilityInput

    def _run(self, location_key: str = "US", icu_capacity: int = 50, ventilator_capacity: int = 20, bed_capacity: int = 200) -> str:
        payload = {
            "location_key": location_key,
            "capacities": {
                "icu": icu_capacity,
                "ventilators": ventilator_capacity,
                "beds": bed_capacity,
            },
            "status": "ready",
            "note": "This utility is used for operational context formatting and does not replace clinical judgement.",
        }
        return json.dumps(payload)
