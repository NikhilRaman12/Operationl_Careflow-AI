import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Type

import pandas as pd
import requests
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


DATA_NOTICE = (
    "Google COVID-19 Open Data is historical/archived public population data. "
    "It is not a real-time clinical feed and must not be used as patient-level medical data."
)

EPIDEMIOLOGY_COLUMNS = [
    "key",
    "date",
    "new_confirmed",
    "new_deceased",
    "new_recovered",
    "new_tested",
    "cumulative_confirmed",
    "cumulative_deceased",
    "cumulative_recovered",
    "cumulative_tested",
]

HOSPITALIZATION_COLUMNS = [
    "key",
    "date",
    "new_hospitalized_patients",
    "cumulative_hospitalized_patients",
    "current_hospitalized_patients",
    "new_intensive_care_patients",
    "cumulative_intensive_care_patients",
    "current_intensive_care_patients",
    "new_ventilator_patients",
    "cumulative_ventilator_patients",
    "current_ventilator_patients",
]


class GoogleCovidBulkDataInput(BaseModel):
    """Input schema for GoogleCovidBulkDataTool."""

    location_key: str = Field(default="US", description="Location key such as US, GB, IN, BR, or US_CA")
    tail_days: int = Field(default=60, description="Number of most recent dated rows to analyze")
    cache_dir: str = Field(default="data/cache", description="Directory for cached Google COVID CSV downloads")
    dataset: str = Field(default="combined", description="Dataset to fetch: epidemiology, hospitalizations, or combined")


class GoogleCovidBulkDataTool(BaseTool):
    name: str = "GoogleCovidBulkDataTool"
    description: str = (
        "Fetches Google COVID-19 Open Data CSV files from public GCS endpoints, caches successful downloads, "
        "uses cuDF when installed or pandas otherwise, and computes population-level COVID care operations KPIs."
    )
    args_schema: Type[BaseModel] = GoogleCovidBulkDataInput

    def _run(
        self,
        location_key: str = "US",
        tail_days: int = 60,
        cache_dir: str = "data/cache",
        dataset: str = "combined",
    ) -> str:
        try:
            normalized_dataset = self._normalize_dataset(dataset)
            normalized_location = self._normalize_location(location_key)
            cache_path = Path(cache_dir)
            cache_path.mkdir(parents=True, exist_ok=True)

            dataframe_backend, backend_name = self._dataframe_backend()
            cached_files = self._fetch_required_files(
                location_key=normalized_location,
                dataset=normalized_dataset,
                cache_dir=cache_path,
            )
            frame = self._load_dataframes(
                dataframe_backend=dataframe_backend,
                backend_name=backend_name,
                cached_files=cached_files,
                location_key=normalized_location,
                dataset=normalized_dataset,
            )

            payload = self._compute_payload(
                frame=frame,
                backend_name=backend_name,
                cached_files=cached_files,
                location_key=normalized_location,
                dataset=normalized_dataset,
                tail_days=max(1, int(tail_days or 60)),
            )
            return json.dumps(payload, default=self._json_default)
        except Exception as exc:  # pragma: no cover - defensive tool boundary
            return json.dumps(
                {
                    "status": "ERROR",
                    "message": str(exc),
                    "data_notice": DATA_NOTICE,
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                }
            )

    def _normalize_dataset(self, dataset: str) -> str:
        normalized = (dataset or "combined").strip().lower()
        if normalized not in {"epidemiology", "hospitalizations", "combined"}:
            raise ValueError("dataset must be one of: epidemiology, hospitalizations, combined")
        return normalized

    def _normalize_location(self, location_key: str) -> str:
        normalized = (location_key or "US").strip()
        return normalized.upper() if normalized else "US"

    def _dataframe_backend(self) -> tuple[Any, str]:
        try:
            import cudf  # type: ignore

            return cudf, "cudf"
        except Exception:
            return pd, "pandas"

    def _fetch_required_files(self, location_key: str, dataset: str, cache_dir: Path) -> dict[str, Path]:
        endpoints = self._endpoints(location_key=location_key, dataset=dataset)
        cached_files: dict[str, Path] = {}
        for label, url in endpoints.items():
            cache_file = cache_dir / f"{self._safe_name(location_key)}_{label}.csv"
            cached_files[label] = self._download_or_cached(url=url, cache_file=cache_file)
        return cached_files

    def _endpoints(self, location_key: str, dataset: str) -> dict[str, str]:
        base_url = "https://storage.googleapis.com/covid19-open-data/v3"
        is_global = location_key in {"GLOBAL", "WORLD", ""}

        if not is_global:
            return {"location": f"{base_url}/location/{location_key}.csv"}

        endpoints: dict[str, str] = {}
        if dataset in {"epidemiology", "combined"}:
            endpoints["epidemiology"] = f"{base_url}/epidemiology.csv"
        if dataset in {"hospitalizations", "combined"}:
            endpoints["hospitalizations"] = f"{base_url}/hospitalizations.csv"
        return endpoints

    def _safe_name(self, raw: str) -> str:
        return re.sub(r"[^A-Za-z0-9_.-]+", "_", raw.lower()).strip("_") or "global"

    def _download_or_cached(self, url: str, cache_file: Path) -> Path:
        try:
            response = requests.get(url, timeout=60, headers={"User-Agent": "CareFlowAI/1.0"})
            status_code = getattr(response, "status_code", 200)
            if status_code >= 400:
                raise RuntimeError(f"HTTP {status_code} from {url}")
            content = getattr(response, "content", None)
            if content is None:
                content = getattr(response, "text", "").encode("utf-8")
            cache_file.write_bytes(content)
            return cache_file
        except Exception:
            if cache_file.exists() and cache_file.stat().st_size > 0:
                return cache_file
            raise

    def _load_dataframes(
        self,
        dataframe_backend: Any,
        backend_name: str,
        cached_files: dict[str, Path],
        location_key: str,
        dataset: str,
    ):
        frames = []
        for label, path in cached_files.items():
            frame = dataframe_backend.read_csv(str(path))
            frame = self._filter_and_select(frame, location_key=location_key, dataset=dataset, source_label=label)
            frames.append(frame)

        if not frames:
            raise RuntimeError("No Google COVID CSV files were available for analysis")
        if len(frames) == 1:
            return frames[0]

        if backend_name == "cudf":
            merged = frames[0]
            for frame in frames[1:]:
                merged = merged.merge(frame, on=["key", "date"], how="outer")
            return merged

        merged = frames[0]
        for frame in frames[1:]:
            merged = merged.merge(frame, on=["key", "date"], how="outer")
        return merged

    def _filter_and_select(self, frame, location_key: str, dataset: str, source_label: str):
        if "key" in frame.columns and location_key not in {"GLOBAL", "WORLD", ""}:
            frame = frame[frame["key"] == location_key]

        requested_columns = ["key", "date"]
        if dataset in {"epidemiology", "combined"} or source_label == "location":
            requested_columns.extend(EPIDEMIOLOGY_COLUMNS)
        if dataset in {"hospitalizations", "combined"} or source_label == "location":
            requested_columns.extend(HOSPITALIZATION_COLUMNS)

        columns = []
        seen = set()
        for column in requested_columns:
            if column in frame.columns and column not in seen:
                columns.append(column)
                seen.add(column)
        if not columns:
            raise RuntimeError("Fetched Google COVID file did not contain expected columns")
        return frame[columns]

    def _compute_payload(
        self,
        frame,
        backend_name: str,
        cached_files: dict[str, Path],
        location_key: str,
        dataset: str,
        tail_days: int,
    ) -> dict:
        if hasattr(frame, "to_pandas"):
            frame_for_json = frame.to_pandas()
        else:
            frame_for_json = frame.copy()

        if frame_for_json.empty:
            raise RuntimeError(f"No Google COVID rows found for location_key={location_key}")

        if "date" in frame_for_json.columns:
            frame_for_json["date"] = pd.to_datetime(frame_for_json["date"], errors="coerce")
            frame_for_json = frame_for_json.dropna(subset=["date"]).sort_values("date")

        metric_columns = [
            column
            for column in set(EPIDEMIOLOGY_COLUMNS + HOSPITALIZATION_COLUMNS)
            if column not in {"key", "date"} and column in frame_for_json.columns
        ]
        for column in metric_columns:
            frame_for_json[column] = pd.to_numeric(frame_for_json[column], errors="coerce")

        if tail_days and len(frame_for_json) > tail_days:
            frame_for_json = frame_for_json.tail(tail_days)

        latest = frame_for_json.iloc[-1]
        cumulative_cases = self._latest_non_null(frame_for_json, "cumulative_confirmed")
        cumulative_deaths = self._latest_non_null(frame_for_json, "cumulative_deceased")
        cfr_pct = (cumulative_deaths / cumulative_cases * 100.0) if cumulative_cases else None

        dates = frame_for_json["date"] if "date" in frame_for_json.columns else pd.Series(dtype="datetime64[ns]")
        payload = {
            "status": "SUCCESS",
            "location_key": location_key,
            "dataset": dataset,
            "backend_used": backend_name,
            "data_source": "Google COVID-19 Open Data public GCS CSV endpoints",
            "data_notice": DATA_NOTICE,
            "cache_file": str(next(iter(cached_files.values()))),
            "cache_files": {label: str(path) for label, path in cached_files.items()},
            "rows_analyzed": int(len(frame_for_json)),
            "date_range": {
                "earliest": self._date_to_string(dates.min()) if not dates.empty else None,
                "latest": self._date_to_string(dates.max()) if not dates.empty else None,
            },
            "kpis": {
                "cumulative_cases": cumulative_cases,
                "cumulative_deaths": cumulative_deaths,
                "cfr_pct": round(cfr_pct, 4) if cfr_pct is not None else None,
                "latest_hospitalized": self._value(latest, "current_hospitalized_patients"),
                "latest_icu": self._value(latest, "current_intensive_care_patients"),
                "latest_ventilator": self._value(latest, "current_ventilator_patients"),
                "peak_hospitalized": self._max(frame_for_json, "current_hospitalized_patients"),
                "peak_icu": self._max(frame_for_json, "current_intensive_care_patients"),
                "peak_ventilator": self._max(frame_for_json, "current_ventilator_patients"),
                "trend_7d": self._trend(frame_for_json, "new_confirmed", 7),
                "trend_14d": self._trend(frame_for_json, "new_confirmed", 14),
            },
            "population_mode": True,
            "patient_level_data_available": False,
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
        return payload

    def _latest_non_null(self, frame: pd.DataFrame, column: str) -> float | None:
        if column not in frame.columns:
            return None
        values = frame[column].dropna()
        if values.empty:
            return None
        return self._number(values.iloc[-1])

    def _value(self, row: pd.Series, column: str) -> float | None:
        if column not in row.index:
            return None
        return self._number(row[column])

    def _max(self, frame: pd.DataFrame, column: str) -> float | None:
        if column not in frame.columns:
            return None
        values = frame[column].dropna()
        if values.empty:
            return None
        return self._number(values.max())

    def _trend(self, frame: pd.DataFrame, column: str, window: int) -> str:
        if column not in frame.columns:
            return "UNKNOWN"
        values = frame[column].dropna()
        if len(values) < 2:
            return "UNKNOWN"
        recent = values.tail(window)
        prior = values.iloc[max(0, len(values) - (window * 2)) : max(0, len(values) - window)]
        if prior.empty:
            return "UNKNOWN"
        recent_avg = float(recent.mean())
        prior_avg = float(prior.mean())
        if recent_avg > prior_avg * 1.01:
            return "INCREASING"
        if recent_avg < prior_avg * 0.99:
            return "DECREASING"
        return "STABLE"

    def _number(self, value: Any) -> float | None:
        if pd.isna(value):
            return None
        number = float(value)
        return int(number) if number.is_integer() else number

    def _date_to_string(self, value: Any) -> str | None:
        if pd.isna(value):
            return None
        if hasattr(value, "strftime"):
            return value.strftime("%Y-%m-%d")
        return str(value)

    def _json_default(self, value: Any) -> Any:
        if hasattr(value, "item"):
            return value.item()
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return str(value)
