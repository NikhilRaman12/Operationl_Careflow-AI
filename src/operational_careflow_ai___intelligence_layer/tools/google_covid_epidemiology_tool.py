import requests
import json
import csv
from io import StringIO
from datetime import datetime
from typing import Type
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class GoogleCovidEpidemiologyInput(BaseModel):
    """Input schema for GoogleCovidEpidemiologyTool."""

    location_key: str = Field(
        default="US",
        description="ISO location key. Examples: 'US', 'IN', 'GB', 'AU', 'BR', 'US_CA'. Leave empty for global data."
    )
    use_latest: bool = Field(
        default=True,
        description="If True, fetches the latest snapshot only. If False, fetches the full time-series."
    )
    tail_days: int = Field(
        default=30,
        description="Number of most recent days to return (only used when use_latest=False). Max 90."
    )


def _safe_float(value):
    """Convert a string value to float, returning None for empty/null/nan values."""
    if value is None:
        return None
    s = str(value).strip()
    if s == "" or s.lower() == "nan":
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def _parse_csv_to_rows(text, desired_columns):
    """
    Parse CSV text using csv.DictReader and keep only desired columns that exist.

    Args:
        text: Raw CSV text string.
        desired_columns: List of column names to retain.

    Returns:
        Tuple of (keep_cols list, rows list of dicts).
    """
    reader = csv.DictReader(StringIO(text))
    available_cols = set(reader.fieldnames or [])
    keep_cols = [c for c in desired_columns if c in available_cols]
    rows = []
    for row in reader:
        filtered = {c: row[c] for c in keep_cols}
        rows.append(filtered)
    return keep_cols, rows


class GoogleCovidEpidemiologyTool(BaseTool):
    """Tool for fetching COVID-19 epidemiology data from Google COVID-19 Open Data public GCS endpoints."""

    name: str = "GoogleCovidEpidemiologyTool"
    description: str = (
        "Fetches real COVID-19 epidemiology time-series data from Google COVID-19 Open Data (GCS public bucket). "
        "Returns cases, deaths, recoveries, and test counts by location key and date range. "
        "Use location keys like 'US', 'IN', 'GB', 'AU', 'BR', 'US_CA'. "
        "Set use_latest=True for the most recent snapshot only."
    )
    args_schema: Type[BaseModel] = GoogleCovidEpidemiologyInput

    def _run(self, location_key: str = "US", use_latest: bool = True, tail_days: int = 30) -> str:
        """
        Fetches COVID-19 epidemiology data from Google's public GCS bucket.

        Args:
            location_key: ISO location key (e.g. 'US', 'IN', 'GB'). Empty string for global.
            use_latest: If True, fetch the latest snapshot only.
            tail_days: Number of most recent days to return when use_latest=False (max 90).

        Returns:
            JSON string with status, summary, and records.
        """
        try:
            # --- Build URL ---
            location_key = (location_key or "").strip()
            is_global = not location_key or location_key.upper() == "GLOBAL"

            if not is_global:
                url = f"https://storage.googleapis.com/covid19-open-data/v3/location/{location_key}.csv"
            elif use_latest:
                url = "https://storage.googleapis.com/covid19-open-data/v3/latest/epidemiology.csv"
            else:
                url = "https://storage.googleapis.com/covid19-open-data/v3/epidemiology.csv"

            # --- Fetch data ---
            response = requests.get(url, timeout=60, headers={"User-Agent": "CareFlowAI/1.0"})

            if response.status_code != 200:
                return json.dumps({
                    "status": "ERROR",
                    "message": f"HTTP {response.status_code} received from Google COVID-19 Open Data. URL: {url}"
                })

            # --- Parse CSV with pure Python csv module ---
            desired_columns = [
                "key", "date",
                "new_confirmed", "new_deceased", "new_recovered", "new_tested",
                "cumulative_confirmed", "cumulative_deceased", "cumulative_recovered", "cumulative_tested"
            ]
            keep_cols, rows = _parse_csv_to_rows(response.text, desired_columns)

            # --- Filter rows by location_key if not global ---
            if not is_global and "key" in keep_cols:
                rows = [r for r in rows if r.get("key") == location_key]

            # --- Sort by date ascending (YYYY-MM-DD string sort is correct) ---
            if "date" in keep_cols:
                rows.sort(key=lambda r: r.get("date") or "")

            # --- Apply tail_days (only for time-series, non-latest) ---
            if not use_latest and tail_days > 0:
                clamped = min(tail_days, 90)
                rows = rows[-clamped:]

            # --- Drop rows where all metric columns are empty ---
            metric_cols = [
                c for c in ["new_confirmed", "new_deceased", "new_recovered", "new_tested"]
                if c in keep_cols
            ]
            if metric_cols:
                rows = [
                    r for r in rows
                    if any(r.get(c, "") not in ("", None) for c in metric_cols)
                ]

            # --- Truncate to 200 records ---
            truncated = len(rows) > 200
            if truncated:
                rows = rows[-200:]

            # --- Clean values: convert numeric strings to float or None ---
            numeric_cols = [c for c in keep_cols if c not in ("key", "date")]
            clean_rows = []
            for r in rows:
                clean = {}
                for c in keep_cols:
                    if c in numeric_cols:
                        clean[c] = _safe_float(r.get(c))
                    else:
                        clean[c] = r.get(c) or None
                clean_rows.append(clean)
            rows = clean_rows

            # --- Build summary ---
            dates = [r["date"] for r in rows if r.get("date")]
            summary = {
                "location_key": location_key if not is_global else "GLOBAL",
                "data_source": "Google COVID-19 Open Data (GCS)",
                "data_notice": "Repository archived Nov 2024. Data covers up to Sep 2022.",
                "records_returned": len(rows),
                "date_range": {
                    "earliest": min(dates) if dates else "unknown",
                    "latest": max(dates) if dates else "unknown"
                },
                "totals": {}
            }

            if truncated:
                summary["truncated_to"] = 200

            # --- Compute totals from last non-None cumulative values ---
            for cum_col in ["cumulative_confirmed", "cumulative_deceased", "cumulative_recovered"]:
                if cum_col in keep_cols:
                    vals = [r[cum_col] for r in rows if r.get(cum_col) is not None]
                    if vals:
                        summary["totals"][cum_col] = vals[-1]

            # --- Return final result ---
            return json.dumps({
                "status": "SUCCESS",
                "summary": summary,
                "records": rows
            }, default=str)

        except requests.exceptions.Timeout:
            return json.dumps({
                "status": "ERROR",
                "message": "Request timed out. Try use_latest=True."
            })
        except Exception as exc:
            return json.dumps({
                "status": "ERROR",
                "message": str(exc)
            })
