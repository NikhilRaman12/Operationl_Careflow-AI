import { CheckCircle2, LockKeyhole, ShieldAlert, UsersRound } from "lucide-react";

import { Badge, GlassCard } from "../components/Enterprise";
import { Section } from "../components/Section";
import type { DashboardData } from "../types/careflow";

type RiskAllocationProps = {
  data: DashboardData;
};

const matrix = [
  ["Low", "Monitor", "Watch"],
  ["Monitor", "Elevated", "High"],
  ["Watch", "High", "Critical"],
];

export function RiskAllocation({ data }: RiskAllocationProps) {
  const patientMode = data.google.patient_level_data_available === true;

  return (
    <Section id="risk" eyebrow="Risk Intelligence" title="Operational Risk Matrix">
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold text-white">Risk score matrix</p>
              <p className="mt-1 text-sm text-slate-400">Population benchmark risk surface; patient mode remains gated.</p>
            </div>
            <Badge tone="teal">Population Benchmark Mode</Badge>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {matrix.flatMap((row, rowIndex) =>
              row.map((label, colIndex) => {
                const critical = label === "Critical";
                const high = label === "High";
                const elevated = label === "Elevated";
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`rounded-xl border p-4 text-center text-sm font-semibold ${
                      critical
                        ? "border-red-300/30 bg-red-400/20 text-red-100"
                        : high
                          ? "border-amber-300/30 bg-amber-400/20 text-amber-100"
                          : elevated
                            ? "border-blue-300/30 bg-blue-400/20 text-blue-100"
                            : "border-teal-300/20 bg-teal-400/10 text-teal-100"
                    }`}
                  >
                    {label}
                  </div>
                );
              }),
            )}
          </div>
        </GlassCard>

        <div className="grid gap-3 md:grid-cols-2">
          <GlassCard>
            <CheckCircle2 className="h-6 w-6 text-teal-200" />
            <h3 className="mt-4 text-lg font-semibold text-white">Population Benchmark Mode</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Active. Supports aggregate operational planning and historical benchmark interpretation.</p>
            <Badge tone="teal">Active</Badge>
          </GlassCard>
          <GlassCard>
            {patientMode ? <UsersRound className="h-6 w-6 text-teal-200" /> : <LockKeyhole className="h-6 w-6 text-slate-400" />}
            <h3 className="mt-4 text-lg font-semibold text-white">Patient Triage Mode</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Requires a real de-identified patient CSV. No patient IDs or clinical indicators are fabricated.</p>
            <Badge tone={patientMode ? "teal" : "slate"}>{patientMode ? "Available" : "Locked"}</Badge>
          </GlassCard>
          <GlassCard className="md:col-span-2">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-200" />
              <div>
                <p className="font-semibold text-white">Operational priority</p>
                <p className="text-sm text-slate-400">Prepare hospital dataset ingestion before using patient-level allocation or severity scoring.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Section>
  );
}
