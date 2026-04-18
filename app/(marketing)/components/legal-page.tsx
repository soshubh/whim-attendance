import type { ReactNode } from "react";

import { MarketingPageShell } from "./marketing-page-shell";

type LegalSection = {
  title: string;
  body: ReactNode[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  lastUpdated,
  sections,
}: LegalPageProps) {
  return (
    <MarketingPageShell className="marketing-legal-page">
      <section className="marketing-legal-hero">
        <span className="marketing-section-label">{eyebrow}</span>
        <div className="marketing-legal-heading">
          <h1 className="marketing-hero-title">{title}</h1>
          <p className="marketing-hero-copy">{intro}</p>
        </div>
        <span className="marketing-legal-updated">{lastUpdated}</span>
      </section>

      <section className="marketing-legal-section">
        <div className="marketing-legal-stack">
          {sections.map((section) => (
            <article key={section.title} className="marketing-legal-card">
              <h2>{section.title}</h2>
              <div className="marketing-legal-copy">
                {section.body.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </MarketingPageShell>
  );
}
