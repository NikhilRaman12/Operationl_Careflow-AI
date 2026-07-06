# Operational CareFlow AI

GPU-Accelerated Hospital Decision Intelligence for COVID Care Operations

Operational CareFlow AI is a CrewAI-based decision intelligence workflow for hospital operations teams. It ingests historical Google COVID-19 Open Data, computes population-level care operations KPIs, runs a pandas versus optional NVIDIA RAPIDS/cuDF benchmark, and generates submission-ready demo artifacts for ICU, ventilator, bed, and surge-planning discussions.

## Problem

Hospital administrators need fast, grounded situational awareness during respiratory surge planning. Public COVID data can provide useful population-level context, but it must not be confused with patient records or real-time clinical telemetry. CareFlow AI turns that historical public data into clear operational signals while preserving strict safety boundaries.

## Users

- Hospital operations leaders planning bed and ICU capacity
- ICU and ventilator coordinators watching resource pressure
- Emergency preparedness teams preparing surge playbooks
- Health system analytics teams evaluating GPU-accelerated workflows
- Hackathon judges reviewing an end-to-end AI operations submission

## What It Produces

Each run writes four demo artifacts under `outputs/`:

- `outputs/executive_report.md`
- `outputs/decision_summary.json`
- `outputs/google_covid_kpis.json`
- `outputs/gpu_benchmark.json`

The default run works in population mode with `location_key="US"` and does not fabricate patient IDs, patient vitals, ward names, or individual triage decisions.

## Architecture

CareFlow AI keeps the existing CrewAI structure:

- `src/operational_careflow_ai___intelligence_layer/crew.py` defines the CrewAI agents, tools, tasks, and submission artifact builder.
- `src/operational_careflow_ai___intelligence_layer/config/agents.yaml` defines agent roles and goals.
- `src/operational_careflow_ai___intelligence_layer/config/tasks.yaml` defines the execution plan and safety constraints.
- `src/operational_careflow_ai___intelligence_layer/tools/` contains Google COVID ingestion, hospitalization/epidemiology helpers, GPU benchmarking, and CareFlow utility tooling.
- `src/operational_careflow_ai___intelligence_layer/main.py` provides the `crewai run` entrypoint and CLI/env overrides.

## Agents

The workflow is organized around specialized agents:

- Google COVID Live Data Fetching Specialist
- Hospital Data Ingestion and Validation Specialist
- GPU-Accelerated Hospital Operations Analytics Engineer
- Clinical Operations Patient Risk Scoring Specialist
- Hospital Resource Demand Forecasting Analyst
- Hospital Operational Resource Allocation Strategist
- Gemini-Powered Hospital Decision Intelligence Communicator
- Hospital Operations Executive Report Compiler
- CareFlow AI Supervisor and Orchestration Controller

## Google COVID Data Source

The ingestion tool reads public CSVs from Google COVID-19 Open Data GCS endpoints:

- Location-specific endpoint: `https://storage.googleapis.com/covid19-open-data/v3/location/{location_key}.csv`
- Bulk epidemiology endpoint: `https://storage.googleapis.com/covid19-open-data/v3/epidemiology.csv`
- Bulk hospitalizations endpoint: `https://storage.googleapis.com/covid19-open-data/v3/hospitalizations.csv`

The tool supports `epidemiology`, `hospitalizations`, and `combined` modes. Successful downloads are cached in `data/cache/`; if a later network fetch fails, the cached CSV can be used as fallback.

Important data boundary: Google COVID-19 Open Data is historical/archived public population data. It is not a real-time clinical feed and it is not patient-level hospital data.

## Computed Analytics

The bulk data tool computes JSON-compatible population KPIs:

- cumulative cases
- cumulative deaths
- case fatality ratio
- latest hospitalized patients
- latest ICU patients
- latest ventilator patients
- peak hospitalized patients
- peak ICU patients
- peak ventilator patients
- 7-day confirmed-case trend
- 14-day confirmed-case trend

When no de-identified patient CSV is supplied, CareFlow AI stays in population-estimate mode. Patient-level triage is only appropriate when a real de-identified patient CSV is provided through `DATA_FILE_PATH` or `--data-file`.

## NVIDIA RAPIDS / cuDF Acceleration

CareFlow AI is CPU-compatible by default and GPU-ready when the environment supports RAPIDS:

- `GoogleCovidBulkDataTool` attempts to load and process CSV data with `cuDF`.
- If `cuDF` is unavailable, the tool falls back to `pandas`.
- `GPUBenchmarkTool` measures CSV load, groupby, aggregation, and join operations in pandas and, when installed, cuDF.
- The generated benchmark JSON marks GPU status and reports a speedup factor when cuDF runs successfully.

cuDF installation depends on CUDA, driver, Python, and platform compatibility. It is intentionally not forced in `pyproject.toml`. Install RAPIDS/cuDF separately using the official NVIDIA RAPIDS instructions for your CUDA environment.

## Gemini and Model Configuration

The default model is Gemini Flash via LiteLLM-compatible CrewAI configuration:

```bash
CAREFLOW_LLM_MODEL=gemini/gemini-1.5-flash
GEMINI_API_KEY=your_key_here
```

OpenAI remains supported by changing the model:

```bash
CAREFLOW_LLM_MODEL=openai/gpt-4o-mini
OPENAI_API_KEY=your_key_here
```

The artifact-generation path runs the deterministic tools directly, so the default demo artifacts can be generated without fabricating LLM content.

## Setup

Prerequisites:

- Python >=3.10, <3.14
- `uv`
- Node.js 18+ for the React dashboard
- Network access for the first Google COVID data fetch, unless cached files already exist

Install Python dependencies:

```bash
uv sync
```

Create local environment settings:

```bash
copy .env.example .env
```

On PowerShell, you can also run:

```powershell
Copy-Item .env.example .env
```

Backend environment example:

```bash
copy backend\.env.example backend\.env
```

Frontend environment example:

```bash
copy frontend\.env.example frontend\.env
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Run

Default submission run:

```bash
crewai run
```

Equivalent Python module run:

```bash
uv run python -m operational_careflow_ai___intelligence_layer.main run
```

Override the location and capacities:

```bash
uv run run_crew --location-key US_CA --icu-capacity 50 --ventilator-capacity 20 --bed-capacity 200
```

Or use the module entrypoint:

```bash
uv run python -m operational_careflow_ai___intelligence_layer.main run --location-key US_CA --icu-capacity 50 --ventilator-capacity 20 --bed-capacity 200
```

Environment overrides also work with `crewai run`:

```bash
LOCATION_KEY=US
TOTAL_ICU_CAPACITY=50
TOTAL_VENTILATORS=20
TOTAL_BED_CAPACITY=200
```

## FastAPI Backend

The FastAPI integration layer reads existing artifacts from `outputs/` and can trigger the existing CrewAI pipeline without rebuilding the agent system.

Start the backend from the repository root:

```bash
uv run uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

API endpoints:

- `GET /health`
- `GET /api/summary`
- `GET /api/google-covid-kpis`
- `GET /api/gpu-benchmark`
- `GET /api/executive-report`
- `POST /api/run-pipeline`

If artifacts are missing, the API returns a clear `MISSING` payload telling the frontend that the pipeline has not been run yet. It does not fabricate data.

## React Frontend

The dashboard is a Vite + React + TypeScript application using Tailwind CSS, Recharts, Axios, and Lucide icons.

Start the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`
- Backend docs: `http://127.0.0.1:8000/docs`

The frontend reads `VITE_API_BASE_URL` from `frontend/.env`. It uses clearly marked demo fallback data only when backend output files are missing.

## Demo Flow

1. Start with the default `US` population run.
2. Fetch or reuse cached Google COVID historical CSV data.
3. Compute COVID burden and hospitalization KPIs.
4. Run the pandas/cuDF benchmark.
5. Generate the executive report and JSON decision artifacts.
6. Start the FastAPI backend.
7. Start the React frontend.
8. Use "Run CareFlow Intelligence Pipeline" from the dashboard to refresh artifacts.
9. Review `outputs/decision_summary.json` for the machine-readable summary and the dashboard briefing for executive review.

## Deployment Notes

- Keep the CrewAI pipeline and FastAPI backend in the same deployment unit or mount `outputs/` as shared storage.
- Set `FRONTEND_ORIGIN` on the backend to the deployed frontend origin.
- Set `VITE_API_BASE_URL` at frontend build time to the deployed API base URL.
- Do not commit `.env`, cached CSVs, generated outputs, or frontend build artifacts.
- Install RAPIDS/cuDF only in CUDA-compatible environments; CPU deployments use pandas fallback.

## Docker

Build both containers:

```bash
docker compose build
```

Run the full stack:

```bash
docker compose up
```

Container URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`
- Backend docs: `http://127.0.0.1:8000/docs`

The Compose setup mounts `outputs/` and `data/cache/` so generated artifacts and cached Google COVID downloads persist on the host.

## Safety Disclaimer

CareFlow AI is an operational decision support prototype for administrators and operations teams. It does not provide medical advice, diagnosis, treatment recommendations, or patient-specific clinical decisions. All clinical decisions must be made by licensed healthcare professionals who directly assess patients and apply local protocols.
