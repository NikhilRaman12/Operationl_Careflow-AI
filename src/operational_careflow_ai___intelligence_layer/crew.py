import json
import os
from datetime import datetime
from pathlib import Path

from crewai import Agent, Crew, LLM, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import FileReadTool
from dotenv import load_dotenv

from operational_careflow_ai___intelligence_layer.tools.custom_tool import CareFlowUtilityTool
from operational_careflow_ai___intelligence_layer.tools.google_covid_bulk_data_tool import GoogleCovidBulkDataTool
from operational_careflow_ai___intelligence_layer.tools.google_covid_epidemiology_tool import GoogleCovidEpidemiologyTool
from operational_careflow_ai___intelligence_layer.tools.google_covid_hospitalizations_tool import GoogleCovidHospitalizationsTool
from operational_careflow_ai___intelligence_layer.tools.gpu_benchmark_tool import GPUBenchmarkTool

load_dotenv()

CAREFLOW_LLM_MODEL = os.getenv("CAREFLOW_LLM_MODEL", "gemini/gemini-1.5-flash")


@CrewBase
class OperationalCareflowAiIntelligenceLayerCrew:
    """OperationalCareflowAiIntelligenceLayer crew."""

    def _build_llm(self) -> LLM:
        return LLM(model=CAREFLOW_LLM_MODEL, provider="litellm")

    def _artifacts_dir(self) -> Path:
        return Path(__file__).resolve().parents[2] / "outputs"

    def _cache_dir(self) -> Path:
        return Path(__file__).resolve().parents[2] / "data" / "cache"

    def build_submission_artifacts(self, inputs: dict) -> dict:
        output_dir = self._artifacts_dir()
        output_dir.mkdir(parents=True, exist_ok=True)
        self._cache_dir().mkdir(parents=True, exist_ok=True)

        bulk_tool = GoogleCovidBulkDataTool()
        benchmark_tool = GPUBenchmarkTool()

        kpis_payload = json.loads(
            bulk_tool._run(
                location_key=inputs.get("location_key", "US"),
                tail_days=60,
                cache_dir=str(self._cache_dir()),
                dataset="combined",
            )
        )
        benchmark_payload = json.loads(
            benchmark_tool._run(rows=5000, cache_dir=str(self._cache_dir()))
        )

        decision_summary = {
            "status": "SUCCESS",
            "location_key": inputs.get("location_key", "US"),
            "capacities": {
                "icu": inputs.get("total_icu_capacity", 50),
                "ventilators": inputs.get("total_ventilators", 20),
                "beds": inputs.get("total_bed_capacity", 200),
            },
            "data_source": "Google COVID-19 Open Data (historical population benchmarks)",
            "google_covid_kpis": kpis_payload.get("kpis", {}),
            "gpu_benchmark": benchmark_payload.get("summary", {}),
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "notes": [
                "Population-level estimates are used because no de-identified patient CSV was supplied.",
                "Google COVID Open Data is historical and not a real-time clinical feed.",
            ],
        }

        executive_report = f"""# Operational CareFlow AI Executive Report

## Scope
- Location: {inputs.get('location_key', 'US')}
- ICU capacity: {inputs.get('total_icu_capacity', 50)}
- Ventilator capacity: {inputs.get('total_ventilators', 20)}
- Bed capacity: {inputs.get('total_bed_capacity', 200)}

## Data foundation
The pipeline used Google COVID-19 Open Data population benchmarks for historical COVID burden and hospital resource context. No patient-level CSV was supplied, so the workflow remained in population mode and did not fabricate patient identifiers or individual triage values.

## Google COVID KPI snapshot
- Cumulative cases: {kpis_payload.get('kpis', {}).get('cumulative_cases')}
- Cumulative deaths: {kpis_payload.get('kpis', {}).get('cumulative_deaths')}
- CFR: {kpis_payload.get('kpis', {}).get('cfr_pct')}
- Latest hospitalized: {kpis_payload.get('kpis', {}).get('latest_hospitalized')}
- Latest ICU: {kpis_payload.get('kpis', {}).get('latest_icu')}
- Latest ventilator: {kpis_payload.get('kpis', {}).get('latest_ventilator')}

## GPU benchmark snapshot
- Backend: {benchmark_payload.get('summary', {}).get('backend_used', 'pandas')}
- Rows processed: {benchmark_payload.get('summary', {}).get('rows_processed', 0)}
- Speedup factor: {benchmark_payload.get('summary', {}).get('speedup_factor')}

## Safety disclaimer
These outputs are operational decision support only. Clinical decisions remain the responsibility of licensed healthcare professionals.
"""

        (output_dir / "executive_report.md").write_text(executive_report, encoding="utf-8")
        (output_dir / "decision_summary.json").write_text(json.dumps(decision_summary, indent=2), encoding="utf-8")
        (output_dir / "google_covid_kpis.json").write_text(json.dumps(kpis_payload, indent=2), encoding="utf-8")
        (output_dir / "gpu_benchmark.json").write_text(json.dumps(benchmark_payload, indent=2), encoding="utf-8")

        return {
            "summary": "CareFlow artifacts generated successfully.",
            "outputs": {
                "executive_report": str(output_dir / "executive_report.md"),
                "decision_summary": str(output_dir / "decision_summary.json"),
                "google_covid_kpis": str(output_dir / "google_covid_kpis.json"),
                "gpu_benchmark": str(output_dir / "gpu_benchmark.json"),
            },
        }

    @agent
    def hospital_data_ingestion_validation_specialist(self) -> Agent:
        return Agent(
            config=self.agents_config["hospital_data_ingestion_validation_specialist"],  # type: ignore[index]
            tools=[FileReadTool(), CareFlowUtilityTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @agent
    def gpu_accelerated_hospital_operations_analytics_engineer(self) -> Agent:
        return Agent(
            config=self.agents_config["gpu_accelerated_hospital_operations_analytics_engineer"],  # type: ignore[index]
            tools=[GoogleCovidBulkDataTool(), GPUBenchmarkTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @agent
    def clinical_operations_patient_risk_scoring_specialist(self) -> Agent:
        return Agent(
            config=self.agents_config["clinical_operations_patient_risk_scoring_specialist"],  # type: ignore[index]
            tools=[],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @agent
    def hospital_resource_demand_forecasting_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config["hospital_resource_demand_forecasting_analyst"],  # type: ignore[index]
            tools=[],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @agent
    def hospital_operational_resource_allocation_strategist(self) -> Agent:
        return Agent(
            config=self.agents_config["hospital_operational_resource_allocation_strategist"],  # type: ignore[index]
            tools=[],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @agent
    def gemini_powered_hospital_decision_intelligence_communicator(self) -> Agent:
        return Agent(
            config=self.agents_config["gemini_powered_hospital_decision_intelligence_communicator"],  # type: ignore[index]
            tools=[],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @agent
    def hospital_operations_executive_report_compiler(self) -> Agent:
        return Agent(
            config=self.agents_config["hospital_operations_executive_report_compiler"],  # type: ignore[index]
            tools=[],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @agent
    def careflow_ai_supervisor_orchestration_controller(self) -> Agent:
        return Agent(
            config=self.agents_config["careflow_ai_supervisor_orchestration_controller"],  # type: ignore[index]
            tools=[],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @agent
    def google_covid_live_data_fetching_specialist(self) -> Agent:
        return Agent(
            config=self.agents_config["google_covid_live_data_fetching_specialist"],  # type: ignore[index]
            tools=[GoogleCovidBulkDataTool(), GoogleCovidEpidemiologyTool(), GoogleCovidHospitalizationsTool()],
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            max_execution_time=None,
            llm=self._build_llm(),
        )

    @task
    def fetch_live_google_covid_epidemiology_and_hospitalization_data(self) -> Task:
        return Task(config=self.tasks_config["fetch_live_google_covid_epidemiology_and_hospitalization_data"], markdown=False)  # type: ignore[index]

    @task
    def ingest_and_validate_hospital_covid_operational_data(self) -> Task:
        return Task(config=self.tasks_config["ingest_and_validate_hospital_covid_operational_data"], markdown=False)  # type: ignore[index]

    @task
    def gpu_accelerated_hospital_operations_analytics_and_eda(self) -> Task:
        return Task(config=self.tasks_config["gpu_accelerated_hospital_operations_analytics_and_eda"], markdown=False)  # type: ignore[index]

    @task
    def patient_risk_scoring_and_severity_classification(self) -> Task:
        return Task(config=self.tasks_config["patient_risk_scoring_and_severity_classification"], markdown=False)  # type: ignore[index]

    @task
    def near_term_hospital_resource_demand_forecasting(self) -> Task:
        return Task(config=self.tasks_config["near_term_hospital_resource_demand_forecasting"], markdown=False)  # type: ignore[index]

    @task
    def operational_resource_allocation_recommendations(self) -> Task:
        return Task(config=self.tasks_config["operational_resource_allocation_recommendations"], markdown=False)  # type: ignore[index]

    @task
    def gemini_decision_intelligence_briefing_for_hospital_administrators(self) -> Task:
        return Task(config=self.tasks_config["gemini_decision_intelligence_briefing_for_hospital_administrators"], markdown=False)  # type: ignore[index]

    @task
    def executive_operations_report_compilation(self) -> Task:
        return Task(config=self.tasks_config["executive_operations_report_compilation"], markdown=False)  # type: ignore[index]

    @task
    def careflow_ai_pipeline_supervision_and_final_decision_summary(self) -> Task:
        return Task(config=self.tasks_config["careflow_ai_pipeline_supervision_and_final_decision_summary"], markdown=False)  # type: ignore[index]

    @crew
    def crew(self) -> Crew:
        """Creates the OperationalCareflowAiIntelligenceLayer crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
            chat_llm=self._build_llm(),
        )
