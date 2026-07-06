import { AlertTriangle, CheckCircle2 } from "lucide-react";

type StatusBannerProps = {
  fallback: boolean;
  message?: string;
};

export function StatusBanner({ fallback, message }: StatusBannerProps) {
  if (!fallback) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-careteal-100 bg-careteal-50 px-4 py-3 text-sm text-careteal-700 dark:border-careteal-500/30 dark:bg-careteal-700/15 dark:text-careteal-100">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <span>Live backend artifacts loaded from the CareFlow pipeline output directory.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <span>{message || "Demo fallback data is shown because backend output files are missing."}</span>
    </div>
  );
}
