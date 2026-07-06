import { Database, ShieldAlert, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge, GlassCard } from "../components/Enterprise";
import { Section } from "../components/Section";
import type { DashboardData } from "../types/careflow";
import { compactNumber, trendScore } from "./formatters";

type GoogleCovidInsightsProps = {
  data: DashboardData;
};

export function GoogleCovidInsights({ data }: GoogleCovidInsightsProps) {
  const kpis = data.google.kpis || {};
  const trendData = [
    { period: "14-day", score: trendScore(kpis.trend_14d), confidence: 70 },
    { period: "7-day", score: trendScore(kpis.trend_7d), confidence: 84 },
  ];

  return (
    <Section id="google" eyebrow="Population Intelligence" title="Google COVID Open Data Intelligence">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-white">Historical population benchmark</p>
              <p className="mt-1 text-sm text-slate-400">Curated public archive used for operational planning context.</p>
            </div>
            <Database className="h-5 w-5 text-teal-200" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Rows analyzed", data.google.rows_analyzed ?? "Pending"],
              ["Date range", data.google.date_range?.earliest && data.google.date_range?.latest ? `${data.google.date_range.earliest} - ${data.google.date_range.latest}` : "Awaiting dated rows"],
              ["Peak hospitalized", compactNumber(kpis.peak_hospitalized)],
              ["Peak ICU", compactNumber(kpis.peak_icu)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/10 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-normal text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="blue">{data.google.backend_used || "pandas"} backend</Badge>
            <Badge tone="teal">Population Benchmark Mode</Badge>
            <Badge tone="amber">Archived dataset</Badge>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-white">Trend signal</p>
              <p className="mt-1 text-sm text-slate-400">7-day and 14-day case-direction score.</p>
            </div>
            <TrendingDown className="h-5 w-5 text-teal-200" />
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -24, right: 8, top: 12 }}>
                <defs>
                  <linearGradient id="covidTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                <XAxis dataKey="period" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <Area type="monotone" dataKey="score" stroke="#60a5fa" fill="url(#covidTrend)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="mt-4 p-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-200" />
          <p className="text-sm text-slate-300">
            Data limitation: Google COVID Open Data supports historical population benchmarking, not real-time clinical operations.
          </p>
        </div>
      </GlassCard>
    </Section>
  );
}
