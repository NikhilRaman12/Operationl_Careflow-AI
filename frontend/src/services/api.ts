import axios from "axios";
import type {
  DashboardData,
  DecisionSummary,
  GoogleCovidKpis,
  GpuBenchmark,
  HealthResponse,
  RunPipelineResponse,
} from "../types/careflow";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 120000,
});

const demoGoogle: GoogleCovidKpis = {
  status: "DEMO_FALLBACK",
  location_key: "US",
  data_notice:
    "Demo fallback only. Run the CareFlow pipeline to fetch Google COVID Open Data. Google COVID Open Data is historical archived public data, not real-time clinical data.",
  rows_analyzed: 0,
  kpis: {
    cumulative_cases: 92440495,
    cumulative_deaths: 1005195,
    cfr_pct: 1.0874,
    latest_hospitalized: null,
    latest_icu: null,
    latest_ventilator: null,
    peak_hospitalized: 40213,
    peak_icu: 4834,
    peak_ventilator: null,
    trend_7d: "DEMO",
    trend_14d: "DEMO",
  },
};

const demoSummary: DecisionSummary = {
  status: "DEMO_FALLBACK",
  location_key: "US",
  capacities: { icu: 50, ventilators: 20, beds: 200 },
  data_source: "Demo fallback because backend output files are missing.",
  google_covid_kpis: demoGoogle.kpis,
  gpu_benchmark: {
    backend_used: "pandas",
    gpu_available: false,
    rows_processed: 0,
    speedup_factor: null,
    operations: ["csv_load", "groupby", "aggregation", "join"],
  },
  notes: ["Demo fallback data is visible because outputs are missing. Run the pipeline for real artifacts."],
};

const demoGpu: GpuBenchmark = {
  status: "DEMO_FALLBACK",
  summary: demoSummary.gpu_benchmark,
  benchmarks: {
    pandas: {
      backend: "pandas",
      rows_processed: 0,
      timings: {
        csv_load_seconds: 0,
        groupby_seconds: 0,
        aggregation_seconds: 0,
        join_seconds: 0,
      },
      total_seconds: 0,
    },
  },
  note: "Demo fallback only. Run the pipeline to generate benchmark output.",
};

function isMissing(payload: { status?: string }) {
  return payload?.status === "MISSING";
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [healthRes, summaryRes, googleRes, gpuRes, reportRes] = await Promise.all([
    api.get<HealthResponse>("/health"),
    api.get<DecisionSummary>("/api/summary"),
    api.get<GoogleCovidKpis>("/api/google-covid-kpis"),
    api.get<GpuBenchmark>("/api/gpu-benchmark"),
    api.get<string>("/api/executive-report"),
  ]);

  const missing = [summaryRes.data, googleRes.data, gpuRes.data].some(isMissing);
  if (missing) {
    return {
      health: healthRes.data,
      summary: demoSummary,
      google: demoGoogle,
      gpu: demoGpu,
      report: "Demo fallback report. Run the CareFlow Intelligence Pipeline to generate the executive report.",
      fallback: true,
      fallbackReason: "One or more backend output files are missing.",
    };
  }

  return {
    health: healthRes.data,
    summary: summaryRes.data,
    google: googleRes.data,
    gpu: gpuRes.data,
    report: reportRes.data,
    fallback: false,
  };
}

export async function runPipeline(): Promise<RunPipelineResponse> {
  const response = await api.post<RunPipelineResponse>("/api/run-pipeline", {});
  return response.data;
}
