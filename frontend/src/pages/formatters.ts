export function formatNumber(value?: number | null, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function compactNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function trendScore(trend?: string) {
  const normalized = (trend || "").toUpperCase();
  if (normalized === "INCREASING") return 1;
  if (normalized === "DECREASING") return -1;
  return 0;
}

export function pct(numerator?: number | null, denominator?: number | null) {
  if (!numerator || !denominator || denominator <= 0) return null;
  return Math.min(100, (numerator / denominator) * 100);
}

export function displayDate(value?: string | null) {
  if (!value) return "Awaiting run";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function readinessScore(args: {
  hasGoogleData: boolean;
  hasGpuBenchmark: boolean;
  hasCurrentFacilityData: boolean;
  fallback: boolean;
}) {
  let score = 45;
  if (args.hasGoogleData) score += 20;
  if (args.hasGpuBenchmark) score += 15;
  if (args.hasCurrentFacilityData) score += 15;
  if (!args.fallback) score += 5;
  return Math.max(0, Math.min(100, score));
}
