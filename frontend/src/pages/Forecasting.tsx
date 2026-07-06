import { CheckCircle2, ClipboardList, UploadCloud } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge, GlassCard } from "../components/Enterprise";
import { EmptyState } from "../components/EmptyState";
import { Section } from "../components/Section";
import type { DashboardData } from "../types/careflow";

type ForecastingProps = {
  data: DashboardData;
};

export function Forecasting({ data }: ForecastingProps) {
  const kpis = data.google.kpis || {};
  const trendMultiplier = kpis.trend_7d === "INCREASING" ? 1.12 : kpis.trend_7d === "DECREASING" ? 0.94 : 1;
  const currentIcu = kpis.latest_icu ?? 0;
  const currentBeds = kpis.latest_hospitalized ?? 0;
  const currentVentilators = kpis.latest_ventilator ?? 0;
  const hasForecastInputs = Boolean(kpis.latest_icu || kpis.latest_hospitalized || kpis.latest_ventilator);
  const forecast = [
    { horizon: "Now", demand: currentBeds + currentIcu + currentVentilators, low: 0, high: 0 },
    { horizon: "24h", demand: (currentBeds + currentIcu + currentVentilators) * trendMultiplier, low: 0, high: 0 },
    { horizon: "48h", demand: (currentBeds + currentIcu + currentVentilators) * trendMultiplier ** 2, low: 0, high: 0 },
    { horizon: "72h", demand: (currentBeds + currentIcu + currentVentilators) * trendMultiplier ** 3, low: 0, high: 0 },
  ].map((point) => ({ ...point, low: point.demand * 0.88, high: point.demand * 1.12 }));

  return (
    <Section id="forecasting" eyebrow="Forecasting" title="Predictive Operations Timeline">
      <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <GlassCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-white">72-hour forecast engine</p>
              <p className="mt-1 text-sm text-slate-400">Area forecast with confidence band when live facility inputs are available.</p>
            </div>
            <Badge tone={hasForecastInputs ? "teal" : "amber"}>{hasForecastInputs ? "Forecast active" : "Engine ready"}</Badge>
          </div>
          {hasForecastInputs ? (
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast} margin={{ left: -24, right: 8, top: 12 }}>
                  <defs>
                    <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                  <XAxis dataKey="horizon" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                  <Area type="monotone" dataKey="high" stroke="transparent" fill="url(#forecastBand)" />
                  <Area type="monotone" dataKey="demand" stroke="#2dd4bf" fill="rgba(45,212,191,0.12)" strokeWidth={3} />
                  <Area type="monotone" dataKey="low" stroke="transparent" fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Forecast engine ready"
                message="Current public population artifact does not contain live facility occupancy fields."
                action="Upload Hospital Dataset"
                icon={ClipboardList}
              />
            </div>
          )}
        </GlassCard>

        <div className="grid gap-3">
          {[
            { label: "Engine status", value: "Ready for live capacity mode", icon: CheckCircle2, tone: "teal" as const },
            { label: "Required inputs", value: "Beds, ICU, ventilators, oxygen, staff", icon: ClipboardList, tone: "blue" as const },
            { label: "Next action", value: "Upload de-identified census CSV", icon: UploadCloud, tone: "amber" as const },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.label} className="p-3">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-teal-200" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.value}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
          <GlassCard className="p-3">
            <p className="text-sm font-semibold text-white">AI explanation</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Forecasting is intentionally gated. CareFlow will not produce numeric facility forecasts until current census inputs are supplied.
            </p>
          </GlassCard>
        </div>
      </div>
    </Section>
  );
}
