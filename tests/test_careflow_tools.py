import json
import sys
from pathlib import Path
from types import SimpleNamespace

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from operational_careflow_ai___intelligence_layer.tools.google_covid_bulk_data_tool import GoogleCovidBulkDataTool
from operational_careflow_ai___intelligence_layer.tools.gpu_benchmark_tool import GPUBenchmarkTool


def test_google_covid_bulk_data_tool_parses_csv_and_caches(tmp_path):
    csv_text = """key,date,new_confirmed,new_deceased,cumulative_confirmed,cumulative_deceased,current_hospitalized_patients,current_intensive_care_patients,current_ventilator_patients\nUS,2020-01-01,10,1,10,1,20,5,2\nUS,2020-01-02,12,2,22,3,25,7,3\n"""

    class FakeResponse:
        def __init__(self, text, status_code=200):
            self.text = text
            self.status_code = status_code

    import requests

    def fake_get(url, timeout=60, headers=None):
        return FakeResponse(csv_text)

    requests.get = fake_get

    tool = GoogleCovidBulkDataTool()
    result = json.loads(tool._run(location_key="US", tail_days=5, cache_dir=str(tmp_path), dataset="combined"))

    assert result["status"] == "SUCCESS"
    assert result["kpis"]["cumulative_cases"] == 22
    assert result["kpis"]["cumulative_deaths"] == 3
    assert result["cache_file"].endswith(".csv")


def test_gpu_benchmark_tool_returns_cpu_fallback(tmp_path):
    tool = GPUBenchmarkTool()
    result = json.loads(tool._run(rows=2000, cache_dir=str(tmp_path)))

    assert result["status"] == "SUCCESS"
    assert result["summary"]["backend_used"] in {"pandas", "cudf", "pandas-fallback"}
    assert result["summary"]["rows_processed"] == 2000
