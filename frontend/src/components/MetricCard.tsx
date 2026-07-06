import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  status?: string;
  trend?: string;
  tone?: "blue" | "teal" | "amber" | "rose";
};

const toneMap = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
};

export function MetricCard({ title, value, detail, icon: Icon, status, trend, tone = "blue" }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{title}</p>
          <p className="mt-1 break-words text-xl font-semibold text-slate-950">{value}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      {(status || trend) ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {status ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{status}</span> : null}
          {trend ? <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">{trend}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
