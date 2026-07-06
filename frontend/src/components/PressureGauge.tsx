type PressureGaugeProps = {
  label: string;
  value: number | null;
  maxLabel: string;
  detail: string;
};

export function PressureGauge({ label, value, maxLabel, detail }: PressureGaugeProps) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const status = value === null ? "Awaiting feed" : pct >= 85 ? "Critical" : pct >= 65 ? "Elevated" : "Normal";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{maxLabel}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {status}
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-careteal-500 to-careblue-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">{detail}</span>
        <span className="font-semibold text-slate-950 dark:text-white">{value === null ? "Pending data" : `${pct.toFixed(0)}%`}</span>
      </div>
    </div>
  );
}
