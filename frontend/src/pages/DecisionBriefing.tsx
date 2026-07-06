import { BrainCircuit, CheckCircle2, ClipboardCheck, FileWarning, ShieldAlert } from "lucide-react";

import { Badge, GlassCard } from "../components/Enterprise";
import { Section } from "../components/Section";
import type { DashboardData } from "../types/careflow";
import { compactNumber } from "./formatters";

type DecisionBriefingProps = {
  data: DashboardData;
};

function extractSection(report: string, heading: string) {
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = report.match(pattern);
  return match?.[1]?.replace(/[-#*]/g, "").replace(/\s+/g, " ").trim();
}

export function DecisionBriefing({ data }: DecisionBriefingProps) {
  const kpis = data.google.kpis || {};
  const dataFoundation = extractSection(data.report, "Data foundation");
  const populationMode = data.google.patient_level_data_available !== true;
  const cards = [
    {
      title: "Executive Summary",
      icon: BrainCircuit,
      badge: "AI Brief",
      body: dataFoundation || "CareFlow is running in population benchmark mode using generated Google COVID intelligence artifacts.",
    },
    {
      title: "Situation",
      icon: FileWarning,
      badge: "Population Mode",
      body: populationMode
        ? "Live facility pressure is not available from this public dataset. Current hospital operations require census data."
        : "Patient-level census mode is active; operational risk outputs are available.",
    },
    {
      title: "AI Recommendation",
      icon: ClipboardCheck,
      badge: "Today",
      body: `Validate surge readiness, review historical peaks, and prepare hospital census upload. Peak hospitalized: ${compactNumber(kpis.peak_hospitalized)}; peak ICU: ${compactNumber(kpis.peak_icu)}.`,
    },
    {
      title: "Confidence",
      icon: CheckCircle2,
      badge: "Generated",
      body: `Generated artifacts are available for ${data.google.rows_analyzed ?? "selected"} rows with GPU benchmark metadata attached.`,
    },
    {
      title: "Safety Boundary",
      icon: ShieldAlert,
      badge: "Governance",
      body: "Operational decision support only. Not medical diagnosis or patient-specific treatment guidance.",
    },
  ];

  return (
    <Section id="briefing" eyebrow="AI Recommendations" title="Executive AI Briefing">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <GlassCard key={card.title} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <Icon className="h-5 w-5 text-teal-200" />
                <Badge tone="blue">{card.badge}</Badge>
              </div>
              <h3 className="mt-4 font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{card.body}</p>
            </GlassCard>
          );
        })}
      </div>
    </Section>
  );
}
