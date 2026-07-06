import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";

type EmptyStateProps = {
  title: string;
  message: string;
  icon?: LucideIcon;
  action?: string;
};

export function EmptyState({ title, message, icon: Icon = Info, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-44 items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
      <div>
        <Icon className="mx-auto h-8 w-8 text-teal-200" />
        <p className="mt-3 font-semibold text-white">{title}</p>
        <p className="mt-1 max-w-xl text-sm text-slate-400">{message}</p>
        {action ? <p className="mt-3 text-sm font-semibold text-teal-200">{action}</p> : null}
      </div>
    </div>
  );
}
