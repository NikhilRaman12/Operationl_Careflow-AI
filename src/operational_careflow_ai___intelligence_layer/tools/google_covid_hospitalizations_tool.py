import requests
import json
import csv
from io import StringIO
from typing import Type
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

HOSP_COLUMNS = [
    "key", "date",
    "new_hospitalized_patients", "cumulative_hospitalized_patients",
    "current_hospitalized_patients",
    "new_intensive_care_patients", "cumulative_intensive_care_patients",
    "current_intensive_care_patients",
    "new_ventilator_patients", "cumulative_ventilator_patients",
    "current_ventilator_patients",
]

METRIC_COLUMNS = [
    "current_hospitalized_patients",
    "current_intensive_care_patients",
    "current_ventilator_patients",
]


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def safe_float(value):
    """Convert a raw CSV string value to float, or None if missing/invalid."""
    if value is None or str(value).strip() in ("", "nan", "None", "NaN"):
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Input schema
# ---------------------------------------------------------------------------

class GoogleCovidHospitalizationsInput(BaseModel):
    """Input schema for GoogleCovidHospitalizationsTool."""

    location_key: str = Field(
        default="US",
        description="ISO location key. Examples: 'US', 'IN', 'GB', 'AU', 'BR', 'US_CA'. Leave empty for global.",
    )
    use_latest: bool = Field(
        default=True,
        description="If True, fetch the latest snapshot only. If False, fetch full time-series.",
    )
    tail_days: int = Field(
        default=30,
        description="Number of most recent days to return (only when use_latest=False). Max 90.",
    )


# ---------------------------------------------------------------------------
# Tool
# ---------------------------------------------------------------------------

class GoogleCovidHospitalizationsTool(BaseTool):
    """Tool for fetching COVID-19 hospitalization data from Google COVID-19 Open Data public GCS endpoints."""

    name: str = "GoogleCovidHospitalizationsTool"
    description: str = (
        "Fetches real COVID-19 hospitalization data from Google COVID-19 Open Data (GCS public bucket). "
        "Returns ICU patient counts, total hospitalized patients, ventilator patient counts, and related "
        "hospital operational metrics by location key and date range. Use location keys like 'US', 'IN', "
        "'GB', 'AU', 'BR', 'US_CA'. Critical for CareFlow AI resource pressure analysis."
    )
    args_schema: Type[BaseModel] = GoogleCovidHospitalizationsInput

    def _run(
        self,
        location_key: str = "US",
        use_latest: bool = True,
        tail_days: int = 30,
    ) -> str:
        """
        Fetch COVID-19 hospitalization data from Google COVID-19 Open Data GCS endpoints.

        Args:
            location_key: ISO location key (e.g. 'US', 'IN', 'GB'). Leave empty for global.
            use_latest: If True, fetch the latest snapshot. If False, fetch full time-series.
            tail_days: Number of recent days to return when use_latest=False (max 90).

        Returns:
            JSON string with status, summary, and records.
        """
        try:
            # ── 1. Build URL ────────────────────────────────────────────────
            location_key = (location_key or "").strip()
            is_global = not location_key or location_key.upper() == "GLOBAL"

            if not is_global:
                url = f"https://storage.googleapis.com/covid19-open-data/v3/location/{location_key}.csv"
            elif use_latest:
                url = "https://storage.googleapis.com/covid19-open-data/v3/latest/hospitalizations.csv"
            else:
                url = "https://storage.googleapis.com/covid19-open-data/v3/hospitalizations.csv"

            # ── 2. Fetch data ───────────────────────────────────────────────
            try:
                response = requests.get(url, timeout=60, headers={"User-Agent": "CareFlowAI/1.0"})
            except requests.exceptions.Timeout:
                return json.dumps({
                    "status": "ERROR",
                    "message": "Request timed out. Try use_latest=True or a specific location_key.",
                })

            if response.status_code != 200:
                return json.dumps({
                    "status": "ERROR",
                    "message": f"HTTP {response.status_code} from GCS endpoint.",
                    "url": url,
                })

            # ── 3. Parse CSV with csv.DictReader ────────────────────────────
            reader = csv.DictReader(StringIO(response.text))
            available_cols = set(reader.fieldnames or [])
            keep_cols = [c for c in HOSP_COLUMNS if c in available_cols]

            rows = []
            for row in reader:
                filtered = {c: row[c] for c in keep_cols}
                rows.append(filtered)

            # ── 4. Filter by location_key ───────────────────────────────────
            if not is_global and "key" in keep_cols:
                rows = [r for r in rows if r.get("key") == location_key]

            # ── 5. Sort by date ascending ───────────────────────────────────
            if "date" in keep_cols:
                rows.sort(key=lambda r: r.get("date") or "")

            # ── 6. Apply tail_days (only when not use_latest) ───────────────
            if not use_latest and tail_days > 0:
                clamped = min(tail_days, 90)
                rows = rows[-clamped:]

            # ── 7. Drop rows where all METRIC_COLUMNS are empty ─────────────
            present_metrics = [c for c in METRIC_COLUMNS if c in keep_cols]
            if present_metrics:
                rows = [
                    r for r in rows
                    if any(r.get(c, "") not in ("", None) for c in present_metrics)
                ]

            # ── 8. Clean values — convert numeric strings to float or None ──
            numeric_cols = [c for c in keep_cols if c not in ("key", "date")]
            clean_rows = []
            for r in rows:
                clean = {}
                for c in keep_cols:
                    if c in numeric_cols:
                        clean[c] = safe_float(r.get(c))
                    else:
                        clean[c] = r.get(c) or None
                clean_rows.append(clean)
            rows = clean_rows

            # ── 9. Truncate to 200 ──────────────────────────────────────────
            truncated = len(rows) > 200
            if truncated:
                rows = rows[-200:]

            # ── 10. Build summary ───────────────────────────────────────────
            dates = [r["date"] for r in rows if r.get("date")]
            summary = {
                "location_key": location_key if not is_global else "GLOBAL",
                "data_source": "Google COVID-19 Open Data (GCS)",
                "data_notice": "Repository archived Nov 2024. Data covers up to Sep 2022.",
                "records_returned": len(rows),
                "date_range": {
                    "earliest": min(dates) if dates else "unknown",
                    "latest": max(dates) if dates else "unknown",
                },
                "peak_metrics": {},
                "latest_metrics": {},
            }
            if truncated:
                summary["truncated_to"] = 200

            # ── 11. Latest metrics (last row values) ────────────────────────
            if rows:
                last_row = rows[-1]
                for col in METRIC_COLUMNS:
                    if col in keep_cols:
                        summary["latest_metrics"][col] = last_row.get(col)

            # ── 12. Peak metrics (max over all rows) ────────────────────────
            for col in METRIC_COLUMNS:
                if col in keep_cols:
                    vals = [r[col] for r in rows if r.get(col) is not None]
                    summary["peak_metrics"][col] = max(vals) if vals else None

            # ── 13. CareFlow AI note ────────────────────────────────────────
            summary["careflow_ai_note"] = (
                "current_intensive_care_patients maps to ICU load. "
                "current_ventilator_patients maps to ventilator utilization. "
                "current_hospitalized_patients maps to total bed occupancy."
            )

            # ── 14. Return ──────────────────────────────────────────────────
            return json.dumps(
                {
                    "status": "SUCCESS",
                    "summary": summary,
                    "records": rows,
                },
                default=str,
            )

        except Exception as exc:
            return json.dumps({"status": "ERROR", "message": str(exc)})
