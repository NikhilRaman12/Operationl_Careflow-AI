import type { LucideIcon } from "lucide-react";
import { LockKeyhole, MapPin } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl transition duration-200 hover:border-teal-300/30 hover:bg-white/[0.09] ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "teal" | "blue" | "amber" | "red" | "slate";
}) {
  const tones = {
    teal: "border-teal-300/30 bg-teal-300/10 text-teal-100",
    blue: "border-blue-300/30 bg-blue-300/10 text-blue-100",
    amber: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    red: "border-red-300/30 bg-red-300/10 text-red-100",
    slate: "border-white/10 bg-white/10 text-slate-200",
  };
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function MiniSparkline({ values, tone = "teal" }: { values: number[]; tone?: "teal" | "blue" | "amber" | "red" }) {
  const width = 96;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const colors = {
    teal: "#2dd4bf",
    blue: "#60a5fa",
    amber: "#fbbf24",
    red: "#fb7185",
  };
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-24" aria-hidden="true">
      <polyline points={points} fill="none" stroke={colors[tone]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PremiumKpi({
  title,
  value,
  detail,
  icon: Icon,
  status,
  sparkline,
  trend,
  tone = "teal",
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  status: string;
  sparkline: number[];
  trend: string;
  tone?: "teal" | "blue" | "amber" | "red";
}) {
  const iconTone = {
    teal: "bg-teal-300/15 text-teal-200 ring-teal-300/20",
    blue: "bg-blue-300/15 text-blue-200 ring-blue-300/20",
    amber: "bg-amber-300/15 text-amber-200 ring-amber-300/20",
    red: "bg-red-300/15 text-red-200 ring-red-300/20",
  };
  return (
    <GlassCard className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${iconTone[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <Badge tone={tone === "red" ? "red" : tone === "amber" ? "amber" : "teal"}>{status}</Badge>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-normal text-slate-400">{title}</p>
          <p className="mt-1 truncate text-xl font-semibold text-white">{value}</p>
        </div>
        <MiniSparkline values={sparkline} tone={tone} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-slate-400">{detail}</span>
        <span className="shrink-0 font-semibold text-teal-200">{trend}</span>
      </div>
    </GlassCard>
  );
}

export function CircularGauge({
  label,
  value,
  tone = "teal",
  locked,
}: {
  label: string;
  value: number;
  tone?: "teal" | "blue" | "amber" | "red";
  locked?: boolean;
}) {
  const colors = {
    teal: "#2dd4bf",
    blue: "#60a5fa",
    amber: "#fbbf24",
    red: "#fb7185",
  };
  const chart = [
    { name: "Used", value: locked ? 0 : value },
    { name: "Open", value: locked ? 100 : Math.max(0, 100 - value) },
  ];
  return (
    <GlassCard className="p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{label}</p>
        {locked ? <LockKeyhole className="h-4 w-4 text-slate-400" /> : <Badge tone={tone}>{value}%</Badge>}
      </div>
      <div className="mt-2 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chart} dataKey="value" innerRadius={34} outerRadius={48} startAngle={90} endAngle={-270} stroke="none">
              <Cell fill={colors[tone]} />
              <Cell fill="rgba(255,255,255,0.12)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-xs text-slate-400">{locked ? "Hospital Mode Locked" : "Capacity signal"}</p>
    </GlassCard>
  );
}

export function RegionalHeatmap() {
  const regions = [
    { name: "North", level: "Elevated", color: "bg-amber-400/80", x: "left-[18%]", y: "top-[18%]" },
    { name: "West", level: "Stable", color: "bg-teal-400/80", x: "left-[24%]", y: "top-[55%]" },
    { name: "Central", level: "Watch", color: "bg-blue-400/80", x: "left-[48%]", y: "top-[38%]" },
    { name: "South", level: "Planning", color: "bg-teal-300/80", x: "left-[56%]", y: "top-[70%]" },
    { name: "East", level: "High", color: "bg-red-400/80", x: "left-[74%]", y: "top-[45%]" },
  ];
  return (
    <GlassCard className="relative min-h-72 overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Regional severity heatmap</p>
          <p className="mt-1 text-xs text-slate-400">Interactive planning view for population benchmark signals.</p>
        </div>
        <MapPin className="h-5 w-5 text-teal-200" />
      </div>
      <div className="absolute inset-x-6 bottom-6 top-20 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-800/70 via-slate-900/60 to-teal-950/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_70%_55%,rgba(96,165,250,0.16),transparent_32%)]" />
        {regions.map((region) => (
          <div key={region.name} className={`group absolute ${region.x} ${region.y}`}>
            <div className={`h-5 w-5 rounded-full ${region.color} shadow-lg ring-4 ring-white/10 transition group-hover:scale-125`} />
            <div className="pointer-events-none absolute left-1/2 top-7 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl group-hover:block">
              {region.name}: {region.level}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
