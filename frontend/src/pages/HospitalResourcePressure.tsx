import { Bed, HeartPulse, ShieldAlert, UsersRound, Wind } from "lucide-react";

import { Badge, CircularGauge, GlassCard } from "../components/Enterprise";
import { Section } from "../components/Section";
import type { DashboardData } from "../types/careflow";
import { pct } from "./formatters";

type HospitalResourcePressureProps = {
  data: DashboardData;
};

export function HospitalResourcePressure({ data }: HospitalResourcePressureProps) {
  const kpis = data.google.kpis || data.summary.google_covid_kpis || {};
  const capacities = data.summary.capacities || { icu: 50, ventilators: 20, beds: 200 };
  const icuPct = pct(kpis.latest_icu, capacities.icu);
  const bedPct = pct(kpis.latest_hospitalized, capacities.beds);
  const ventPct = pct(kpis.latest_ventilator, capacities.ventilators);
  const locked = !(icuPct || bedPct || ventPct);

  return (
    <Section id="resources" eyebrow="Hospital Operations" title="Resource Pressure Command">
      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <GlassCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-white">Facility capacity mode</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Current public population data cannot represent live hospital occupancy. Upload de-identified census data to unlock real-time operations.
              </p>
            </div>
            <Badge tone={locked ? "amber" : "teal"}>{locked ? "Hospital Mode Locked" : "Live Mode"}</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "ICU beds", value: capacities.icu, icon: HeartPulse },
              { label: "Ventilators", value: capacities.ventilators, icon: Wind },
              { label: "Licensed beds", value: capacities.beds, icon: Bed },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <Icon className="h-4 w-4 text-teal-200" />
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="text-xs text-slate-400">{item.label}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <CircularGauge label="ICU" value={Math.round(icuPct || 0)} tone="amber" locked={locked} />
          <CircularGauge label="Beds" value={Math.round(bedPct || 0)} tone="blue" locked={locked} />
          <CircularGauge label="Ventilators" value={Math.round(ventPct || 0)} tone="red" locked={locked} />
          <CircularGauge label="Oxygen" value={0} tone="teal" locked />
          <CircularGauge label="Staff" value={0} tone="blue" locked />
        </div>
      </div>

      <GlassCard className="mt-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-300/15 text-amber-200 ring-1 ring-amber-300/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">Activation requirement</p>
            <p className="text-sm text-slate-400">Upload hospital census data to activate ICU, beds, ventilators, oxygen, staff, and capacity pressure scoring.</p>
          </div>
          <UsersRound className="ml-auto hidden h-5 w-5 text-slate-500 sm:block" />
        </div>
      </GlassCard>
    </Section>
  );
}
