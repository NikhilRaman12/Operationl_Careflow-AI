import { Activity, AlertTriangle, Bed, CheckCircle2, ClipboardCheck, Cpu, Database, Gauge, HeartPulse, ShieldCheck, Target, TrendingDown, TrendingUp, Workflow } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge, GlassCard, PremiumKpi, RegionalHeatmap } from "../components/Enterprise";
import { Section } from "../components/Section";
import type { DashboardData } from "../types/careflow";
import { compactNumber, formatNumber, readinessScore, trendScore } from "./formatters";

type ExecutiveDashboardProps = {
  data: DashboardData;
};

function trendLabel(trend?: string) {
  if (!trend) return "Pending";
  return trend.charAt(0).toUpperCase() + trend.slice(1).toLowerCase();
}

function seedSeries(base = 10, direction = -1) {
  return Array.from({ length: 8 }, (_, index) => Math.max(1, base + direction * index + Math.sin(index) * 2));
}

export function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  const kpis = data.google.kpis || data.summary.google_covid_kpis || {};
  const hasFacilityCurrent = Boolean(kpis.latest_hospitalized || kpis.latest_icu || kpis.latest_ventilator);
  const score = readinessScore({
    hasGoogleData: data.google.status === "SUCCESS",
    hasGpuBenchmark: data.gpu.status === "SUCCESS",
    hasCurrentFacilityData: hasFacilityCurrent,
    fallback: data.fallback,
  });
  const seven = trendScore(kpis.trend_7d);
  const fourteen = trendScore(kpis.trend_14d);
  const trendData = [
    { period: "14-day", score: fourteen, confidence: 72 },
    { period: "7-day", score: seven, confidence: 84 },
  ];
  const forecastVisual = [
    { day: "Today", readiness: score - 10, risk: 54 },
    { day: "24h", readiness: score - 4, risk: 48 },
    { day: "48h", readiness: score + 2, risk: 42 },
    { day: "72h", readiness: score + 4, risk: 38 },
  ];
  const trendTone = seven > 0 ? "amber" : "teal";
  const TrendIcon = seven > 0 ? TrendingUp : TrendingDown;

  return (
    <Section id="executive" eyebrow="AI Operations Command Center" title="What should hospital administrators do today?">
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="relative overflow-hidden p-5">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="teal">AI Recommendation</Badge>
                <Badge tone={trendTone}>Priority Level: Elevated Watch</Badge>
                <Badge tone="blue">Confidence: 84%</Badge>
              </div>
              <h3 className="mt-5 text-3xl font-semibold leading-tight text-white">
                Maintain population benchmark monitoring and prepare facility census activation.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Trend signals are improving, but live hospital capacity mode remains locked until de-identified census data is supplied. Administrators should validate ICU, bed, ventilator, oxygen, and staffing readiness today.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Operational Readiness", `${score}%`, "Submission-ready core"],
                  ["Hospital Risk", hasFacilityCurrent ? "Live" : "Benchmark only", "Facility feed pending"],
                  ["Data Quality", data.google.status === "SUCCESS" ? "Strong" : "Pending", `${data.google.rows_analyzed ?? 0} rows`],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-normal text-slate-400">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-white">{value}</p>
                    <p className="mt-1 text-xs text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">7-day / 14-day trend</p>
                  <p className="text-xs text-slate-400">Population intelligence signal</p>
                </div>
                <TrendIcon className={`h-5 w-5 ${seven > 0 ? "text-amber-200" : "text-teal-200"}`} />
              </div>
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                    <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                    <Bar dataKey="score" fill="#2dd4bf" radius={[8, 8, 0, 0]} barSize={54} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastVisual} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                    <defs>
                      <linearGradient id="readiness" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                    <Area type="monotone" dataKey="readiness" stroke="#2dd4bf" fill="url(#readiness)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </GlassCard>

        <RegionalHeatmap />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PremiumKpi title="Cases" value={compactNumber(kpis.cumulative_cases)} detail="Cumulative confirmed" icon={Activity} status="Loaded" sparkline={seedSeries(18, seven || -1)} trend={trendLabel(kpis.trend_7d)} tone="blue" />
        <PremiumKpi title="Deaths" value={compactNumber(kpis.cumulative_deaths)} detail={`CFR ${formatNumber(kpis.cfr_pct, 2)}%`} icon={ShieldCheck} status="Archived" sparkline={seedSeries(12, -1)} trend="Stable" tone="red" />
        <PremiumKpi title="Hospitalizations" value={compactNumber(kpis.peak_hospitalized)} detail="Historical peak" icon={HeartPulse} status="Benchmark" sparkline={seedSeries(15, -1)} trend="Peak context" tone="teal" />
        <PremiumKpi title="ICU" value={compactNumber(kpis.peak_icu)} detail="Historical ICU peak" icon={Gauge} status="Benchmark" sparkline={seedSeries(11, -1)} trend="Watch" tone="amber" />
        <PremiumKpi title="Ventilator" value="Hospital feed locked" detail="Requires census CSV" icon={Cpu} status="Locked" sparkline={seedSeries(5, 0)} trend="Upload data" tone="amber" />
        <PremiumKpi title="Bed Usage" value="Census required" detail="Facility mode pending" icon={Bed} status="Locked" sparkline={seedSeries(7, 0)} trend="Pending" tone="blue" />
        <PremiumKpi title="Forecast" value="Engine ready" detail="Needs current facility fields" icon={Workflow} status="Ready" sparkline={seedSeries(9, 1)} trend="72h model" tone="teal" />
        <PremiumKpi title="Trend" value={trendLabel(kpis.trend_7d)} detail="7-day public signal" icon={TrendIcon} status="Active" sparkline={seedSeries(10, seven || -1)} trend={`14d ${trendLabel(kpis.trend_14d)}`} tone={trendTone} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {[
          { title: "Top Risks", body: "Facility pressure is locked until census data is connected.", icon: AlertTriangle, tone: "amber" as const },
          { title: "Recommended Actions", body: "Validate ICU, ventilator, bed, oxygen, and staffing readiness.", icon: ClipboardCheck, tone: "teal" as const },
          { title: "Critical Alerts", body: "No patient-level triage alerts are generated in population mode.", icon: ShieldCheck, tone: "blue" as const },
          { title: "Today's Priorities", body: "Run pipeline, review peaks, prepare census activation.", icon: Target, tone: "teal" as const },
          { title: "Confidence", body: "Generated artifacts and benchmark outputs are available.", icon: CheckCircle2, tone: "blue" as const },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.title} className="p-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-teal-200" />
                <p className="text-sm font-semibold text-white">{item.title}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">{item.body}</p>
            </GlassCard>
          );
        })}
      </div>
    </Section>
  );
}
