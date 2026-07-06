import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function Section({ id, title, eyebrow, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-normal text-teal-200">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}
