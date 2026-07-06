export type ArtifactStatus = {
  exists: boolean;
  path: string;
};

export type HealthResponse = {
  status: string;
  service: string;
  artifacts: Record<string, ArtifactStatus>;
};

export type MissingArtifact = {
  status: "MISSING";
  message: string;
  expected_file: string;
};

export type GoogleCovidKpis = {
  status: string;
  location_key?: string;
  dataset?: string;
  backend_used?: string;
  data_source?: string;
  data_notice?: string;
  rows_analyzed?: number;
  date_range?: {
    earliest?: string | null;
    latest?: string | null;
  };
  kpis?: {
    cumulative_cases?: number | null;
    cumulative_deaths?: number | null;
    cfr_pct?: number | null;
    latest_hospitalized?: number | null;
    latest_icu?: number | null;
    latest_ventilator?: number | null;
    peak_hospitalized?: number | null;
    peak_icu?: number | null;
    peak_ventilator?: number | null;
    trend_7d?: string;
    trend_14d?: string;
  };
  population_mode?: boolean;
  patient_level_data_available?: boolean;
  generated_at?: string;
  message?: string;
};

export type DecisionSummary = {
  status: string;
  location_key?: string;
  capacities?: {
    icu?: number;
    ventilators?: number;
    beds?: number;
  };
  data_source?: string;
  google_covid_kpis?: GoogleCovidKpis["kpis"];
  gpu_benchmark?: {
    backend_used?: string;
    gpu_available?: boolean;
    rows_processed?: number;
    speedup_factor?: number | null;
    operations?: string[];
  };
  generated_at?: string;
  notes?: string[];
  message?: string;
};

export type GpuBenchmark = {
  status: string;
  summary?: {
    backend_used?: string;
    gpu_available?: boolean;
    rows_processed?: number;
    speedup_factor?: number | null;
    operations?: string[];
  };
  benchmarks?: {
    pandas?: BenchmarkResult;
    cudf?: BenchmarkResult | { backend: string; gpu_status?: string; detail?: string };
  };
  note?: string;
  message?: string;
};

export type BenchmarkResult = {
  backend: string;
  rows_processed?: number;
  capacity_rows?: number;
  groupby_rows?: number;
  joined_rows?: number;
  timings?: Record<string, number>;
  total_seconds?: number;
  aggregation_preview?: Record<string, number>;
};

export type RunPipelineResponse = {
  status: string;
  message: string;
  outputs: Record<string, string>;
  summary: DecisionSummary;
  google_covid_kpis: GoogleCovidKpis;
  gpu_benchmark: GpuBenchmark;
};

export type DashboardData = {
  health?: HealthResponse;
  summary: DecisionSummary;
  google: GoogleCovidKpis;
  gpu: GpuBenchmark;
  report: string;
  fallback: boolean;
  fallbackReason?: string;
};
