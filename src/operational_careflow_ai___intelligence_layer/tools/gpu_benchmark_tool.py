import json
import time
from pathlib import Path
from typing import Any, Callable, Type

import pandas as pd
from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class GPUBenchmarkInput(BaseModel):
    rows: int = Field(default=5000, description="Number of synthetic operations rows to benchmark")
    cache_dir: str = Field(default="data/cache", description="Directory used for temporary benchmark CSV artifacts")


class GPUBenchmarkTool(BaseTool):
    name: str = "GPUBenchmarkTool"
    description: str = (
        "Benchmarks pandas and optional cuDF CSV load, groupby, aggregation, and join operations "
        "for CareFlow AI GPU acceleration readiness."
    )
    args_schema: Type[BaseModel] = GPUBenchmarkInput

    def _run(self, rows: int = 5000, cache_dir: str = "data/cache") -> str:
        rows = max(100, int(rows or 5000))
        cache_path = Path(cache_dir)
        cache_path.mkdir(parents=True, exist_ok=True)
        operations_csv, capacity_csv = self._write_benchmark_csvs(rows=rows, cache_path=cache_path)

        pandas_result = self._run_backend(
            backend_name="pandas",
            read_csv=pd.read_csv,
            operations_csv=operations_csv,
            capacity_csv=capacity_csv,
        )

        cudf_result = None
        cudf_available = False
        try:
            import cudf  # type: ignore

            cudf_available = True
            cudf_result = self._run_backend(
                backend_name="cudf",
                read_csv=cudf.read_csv,
                operations_csv=operations_csv,
                capacity_csv=capacity_csv,
            )
        except Exception as exc:
            cudf_result = {
                "backend": "unavailable",
                "gpu_status": "unavailable",
                "detail": f"cuDF is not installed or could not run in this environment: {exc}",
            }

        speedup_factor = None
        backend_used = "pandas"
        if cudf_available and cudf_result and "total_seconds" in cudf_result:
            gpu_total = float(cudf_result["total_seconds"])
            if gpu_total > 0:
                speedup_factor = round(float(pandas_result["total_seconds"]) / gpu_total, 3)
            backend_used = "cudf"

        payload = {
            "status": "SUCCESS",
            "summary": {
                "backend_used": backend_used,
                "gpu_available": cudf_available,
                "rows_processed": rows,
                "speedup_factor": speedup_factor,
                "operations": ["csv_load", "groupby", "aggregation", "join"],
            },
            "benchmarks": {
                "pandas": pandas_result,
                "cudf": cudf_result,
            },
            "note": "cuDF/RAPIDS is optional. CPU-only environments use pandas fallback without blocking the CareFlow pipeline.",
        }
        return json.dumps(payload, default=str)

    def _write_benchmark_csvs(self, rows: int, cache_path: Path) -> tuple[Path, Path]:
        operations_csv = cache_path / "careflow_gpu_benchmark_operations.csv"
        capacity_csv = cache_path / "careflow_gpu_benchmark_capacity.csv"

        operations = pd.DataFrame(
            {
                "hospital_id": [f"H{i % 25:03d}" for i in range(rows)],
                "ward": [f"ward_{i % 8}" for i in range(rows)],
                "resource_type": [["bed", "icu", "ventilator", "oxygen"][i % 4] for i in range(rows)],
                "observed_count": [(i * 7) % 113 for i in range(rows)],
                "demand_score": [((i * 13) % 1000) / 10.0 for i in range(rows)],
            }
        )
        capacity = pd.DataFrame(
            {
                "hospital_id": [f"H{i:03d}" for i in range(25)],
                "licensed_beds": [180 + (i * 3) for i in range(25)],
                "icu_capacity": [30 + (i % 7) for i in range(25)],
            }
        )

        operations.to_csv(operations_csv, index=False)
        capacity.to_csv(capacity_csv, index=False)
        return operations_csv, capacity_csv

    def _run_backend(
        self,
        backend_name: str,
        read_csv: Callable[[str], Any],
        operations_csv: Path,
        capacity_csv: Path,
    ) -> dict:
        timings: dict[str, float] = {}

        start = time.perf_counter()
        operations = read_csv(str(operations_csv))
        capacity = read_csv(str(capacity_csv))
        timings["csv_load_seconds"] = time.perf_counter() - start

        start = time.perf_counter()
        groupby_result = operations.groupby(["hospital_id", "resource_type"]).agg({"observed_count": "sum"})
        timings["groupby_seconds"] = time.perf_counter() - start

        start = time.perf_counter()
        aggregation_result = operations.agg({"observed_count": "sum", "demand_score": "mean"})
        timings["aggregation_seconds"] = time.perf_counter() - start

        start = time.perf_counter()
        joined = operations.merge(capacity, on="hospital_id", how="left")
        timings["join_seconds"] = time.perf_counter() - start

        total = sum(timings.values())
        return {
            "backend": backend_name,
            "rows_processed": int(len(operations)),
            "capacity_rows": int(len(capacity)),
            "groupby_rows": int(len(groupby_result)),
            "joined_rows": int(len(joined)),
            "timings": {name: round(value, 6) for name, value in timings.items()},
            "total_seconds": round(total, 6),
            "aggregation_preview": self._aggregation_preview(aggregation_result),
        }

    def _aggregation_preview(self, aggregation_result: Any) -> dict:
        if hasattr(aggregation_result, "to_pandas"):
            aggregation_result = aggregation_result.to_pandas()
        if hasattr(aggregation_result, "to_dict"):
            return aggregation_result.to_dict()
        return {"raw": str(aggregation_result)}
