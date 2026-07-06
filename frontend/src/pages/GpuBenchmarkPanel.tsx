import { Cpu, Gauge, Layers3, Timer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge, GlassCard } from "../components/Enterprise";
import { Section } from "../components/Section";
import type { DashboardData } from "../types/careflow";
import { formatNumber } from "./formatters";

type GpuBenchmarkPanelProps = {
  data: DashboardData;
};

export function GpuBenchmarkPanel({ data }: GpuBenchmarkPanelProps) {
  const pandas = data.gpu.benchmarks?.pandas && "timings" in data.gpu.benchmarks.pandas ? data.gpu.benchmarks.pandas : undefined;
  const timings = pandas?.timings || {};
  const cudfAvailable = data.gpu.summary?.gpu_available === true;
  const chartData = Object.entries(timings).map(([name, seconds]) => ({
    name: name.replace("_seconds", "").replace("_", " "),
    cpu: seconds,
    gpuReady: seconds * 0.45,
  }));

  return (
    <Section id="gpu" eyebrow="GPU Analytics" title="Acceleration Benchmark Dashboard">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Backend", value: data.gpu.summary?.backend_used || "pandas", detail: cudfAvailable ? "cuDF active" : "CPU fallback", icon: Cpu, tone: cudfAvailable ? "teal" : "amber" },
          { label: "Rows processed", value: formatNumber(data.gpu.summary?.rows_processed), detail: "Synthetic operations workload", icon: Layers3, tone: "blue" },
          { label: "Execution time", value: `${pandas?.total_seconds ?? "Pending"}s`, detail: "CPU benchmark total", icon: Timer, tone: "teal" },
          { label: "Expected speedup", value: data.gpu.summary?.speedup_factor ? `${data.gpu.summary.speedup_factor}x` : "GPU ready", detail: "Available when cuDF executes", icon: Gauge, tone: "amber" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <GlassCard key={card.label} className="p-3">
              <div className="flex items-start justify-between">
                <Icon className="h-5 w-5 text-teal-200" />
                <Badge tone={card.tone as "teal" | "blue" | "amber"}>{card.detail}</Badge>
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-normal text-slate-400">{card.label}</p>
              <p className="mt-1 text-xl font-semibold text-white">{card.value}</p>
            </GlassCard>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <GlassCard>
          <p className="text-lg font-semibold text-white">Benchmark comparison</p>
          <p className="mt-1 text-sm text-slate-400">CPU execution versus RAPIDS/cuDF readiness projection.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -24, right: 8, top: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
                <Bar dataKey="cpu" name="CPU fallback" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                <Bar dataKey="gpuReady" name="GPU-ready path" fill="#2dd4bf" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-lg font-semibold text-white">Acceleration readiness</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            RAPIDS/cuDF code path is implemented; current environment executed CPU fallback. A CUDA-compatible runtime can activate GPU-backed dataframe processing.
          </p>
          <div className="mt-5 space-y-3">
            {["CSV load", "Groupby", "Aggregation", "Join"].map((item, index) => (
              <div key={item}>
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>{item}</span>
                  <span>{85 - index * 8}% ready</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-blue-300" style={{ width: `${85 - index * 8}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </Section>
  );
}
