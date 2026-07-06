import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  Settings,
  RefreshCw,
  Server,
} from "lucide-react";

import { DashboardSkeleton } from "./components/Skeleton";
import { DecisionBriefing } from "./pages/DecisionBriefing";
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";
import { Forecasting } from "./pages/Forecasting";
import { GoogleCovidInsights } from "./pages/GoogleCovidInsights";
import { GpuBenchmarkPanel } from "./pages/GpuBenchmarkPanel";
import { HospitalResourcePressure } from "./pages/HospitalResourcePressure";
import { RiskAllocation } from "./pages/RiskAllocation";
import { displayDate } from "./pages/formatters";
import { fetchDashboardData, runPipeline } from "./services/api";
import type { DashboardData } from "./types/careflow";

const navItems = [
  { label: "Command Center", href: "#executive", icon: LayoutDashboard },
  { label: "COVID Intelligence", href: "#google", icon: Database },
  { label: "Resource Pressure", href: "#resources", icon: Gauge },
  { label: "Forecasting", href: "#forecasting", icon: BarChart3 },
  { label: "Risk & Allocation", href: "#risk", icon: LockKeyhole },
  { label: "AI Briefing", href: "#briefing", icon: BrainCircuit },
  { label: "GPU Acceleration", href: "#gpu", icon: Cpu },
  { label: "System Health", href: "#system", icon: Server },
  { label: "Settings", href: "#settings", icon: Settings },
];

const techBadges = ["Google COVID Open Data", "CrewAI", "Gemini", "RAPIDS/cuDF", "FastAPI"];

function statusBadge(data: DashboardData | null) {
  if (!data) return "Loading";
  if (data.fallback) return "Needs pipeline run";
  return data.summary.status || "Operational";
}

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach CareFlow API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunPipeline() {
    setRunning(true);
    setError(null);
    try {
      await runPipeline();
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline execution failed.");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const content = useMemo(() => {
    if (loading) return <DashboardSkeleton />;
    if (!data) return null;
    return (
      <div className="space-y-7">
        {data.fallback ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Demo fallback is active because one or more output files are missing. Run the pipeline to load generated CareFlow artifacts.
          </div>
        ) : null}
        <ExecutiveDashboard data={data} />
        <GoogleCovidInsights data={data} />
        <HospitalResourcePressure data={data} />
        <Forecasting data={data} />
        <RiskAllocation data={data} />
        <DecisionBriefing data={data} />
        <GpuBenchmarkPanel data={data} />
        <section id="system" className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-white backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-normal text-teal-200">System Health</p>
            <h2 className="mt-1 text-xl font-semibold">Pipeline connectivity</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["FastAPI online", "Artifacts loaded", "Frontend synced"].map((item) => (
                <div key={item} className="rounded-xl bg-white/10 p-3 text-sm font-semibold text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div id="settings" className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-white backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-normal text-teal-200">Settings</p>
            <h2 className="mt-1 text-xl font-semibold">Operational controls</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Location, capacity, and model settings remain controlled by the existing backend environment and pipeline configuration.
            </p>
          </div>
        </section>
      </div>
    );
  }, [data, loading]);

  const location = data?.summary.location_key || data?.google.location_key || "US";
  const generatedAt = displayDate(data?.summary.generated_at || data?.google.generated_at);

  return (
    <div className="min-h-screen bg-[#071527] text-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-[#081a2f]/95 px-3 py-5 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 lg:block ${collapsed ? "w-20" : "w-72"}`}>
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-teal-400/15 text-teal-200 ring-1 ring-teal-300/20">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div className={collapsed ? "hidden" : "block"}>
            <p className="text-sm font-semibold">Operational CareFlow AI</p>
            <p className="text-xs text-slate-400">v0.1 Enterprise Command</p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className="h-4 w-4 text-teal-200" />
                <span className={collapsed ? "hidden" : "inline"}>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className={`absolute bottom-5 left-3 right-3 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300 ${collapsed ? "hidden" : "block"}`}>
          <p>Population benchmark mode is active until de-identified hospital census data is supplied.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techBadges.slice(0, 3).map((badge) => (
              <span key={badge} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-teal-100">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${collapsed ? "lg:pl-20" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#071527]/95 px-4 py-4 text-white backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-teal-200">GPU-Accelerated Hospital Decision Intelligence</p>
              <h1 className="mt-1 text-2xl font-semibold">Executive Command Center</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {techBadges.map((badge) => (
                  <span key={badge} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">
                {statusBadge(data)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                Location {location}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                Generated {generatedAt}
              </span>
              <button
                type="button"
                onClick={handleRunPipeline}
                disabled={running}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-400 px-4 py-2 text-sm font-semibold text-[#062033] shadow-sm transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                {running ? "Running" : "Run Pipeline"}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-4">
          {error ? (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
          {content}
        </main>

        <footer className="mx-auto max-w-7xl px-4 pb-8">
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Operational decision support only. CareFlow AI does not provide medical diagnosis, treatment guidance, or patient-specific clinical decisions. Google COVID Open Data is historical archived public data, not a real-time clinical feed.
          </div>
        </footer>
      </div>
    </div>
  );
}
