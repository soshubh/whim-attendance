import Image from "next/image";
import Link from "next/link";

const shortcuts = [
  "Create your workspace in under two minutes.",
  "Copy the fixed IN and OUT shortcut URLs.",
  "Use one iPhone arrival automation and one leave automation.",
  "Watch the dashboard update with each attendance event.",
];

const benefits = [
  {
    title: "Private workspace per user",
    copy:
      "Every user gets a separate dashboard, personal shortcut URLs, and their own attendance history.",
  },
  {
    title: "Shortcut-first logging",
    copy:
      "No headers, no JSON payloads, and no manual event body. Each automation only posts to one fixed URL.",
  },
  {
    title: "Built for real operations",
    copy:
      "Track attendance, leave, and WFH activity in one place without exposing database credentials in the client.",
  },
];

const highlights = [
  "Email/password auth with workspace onboarding",
  "Dedicated IN and OUT URLs for iPhone automations",
  "Live dashboard updates via Supabase Realtime",
  "Single-user and multi-user expansion path from one codebase",
];

export default function LandingPage() {
  return (
    <main className="marketing-shell">
      <div className="marketing-grid" aria-hidden="true" />
      <header className="marketing-topbar-wrap">
        <div className="marketing-topbar">
          <Link href="/" className="marketing-brand" aria-label="WHIM home">
            <Image
              src="/brand/FBFLogo.png"
              alt="WHIM logo"
              width={44}
              height={44}
              className="marketing-brand-icon"
              priority
            />
            <Image
              src="/brand/wordmark/WordMark.svg"
              alt="WHIM"
              width={134}
              height={28}
              className="marketing-brand-wordmark"
              priority
            />
          </Link>

          <nav className="marketing-nav" aria-label="Landing navigation">
            <a href="#workflow">How it works</a>
            <a href="#benefits">Why Attend</a>
            <a href="#highlights">Highlights</a>
          </nav>

          <div className="marketing-topbar-actions">
            <Link href="/login" className="marketing-button marketing-button-secondary">
              Log in
            </Link>
            <Link href="/signup" className="marketing-button marketing-button-primary">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <section className="marketing-hero">
        <div className="marketing-kicker">Attendance software for shortcut-first teams</div>
        <h1 className="marketing-hero-title">
          Turn iPhone automations into a clean, private attendance workspace.
        </h1>
        <p className="marketing-hero-copy">
          Attend gives each user a secure workspace, fixed shortcut URLs, and a live dashboard for
          attendance activity without exposing backend keys or forcing technical setup.
        </p>
        <div className="marketing-hero-actions">
          <Link href="/signup" className="marketing-button marketing-button-primary">
            Create workspace
          </Link>
          <Link href="/login" className="marketing-pill-link">
            Existing user? Open dashboard
          </Link>
        </div>
      </section>

      <section className="marketing-banner" aria-label="Product summary">
        <p>
          Launch personal attendance workspaces with one shared product shell, two fixed shortcut
          URLs, and marketing pages that stay visually separate from the dashboard application.
        </p>
      </section>

      <section id="workflow" className="marketing-section">
        <div className="marketing-section-copy">
          <p className="marketing-section-label">Workflow</p>
          <h2>One onboarding flow, then automation does the rest.</h2>
        </div>

        <div className="marketing-workflow-panel">
          {shortcuts.map((item, index) => (
            <div key={item} className="marketing-step-card">
              <span className="marketing-step-index">0{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="benefits" className="marketing-section">
        <div className="marketing-section-copy">
          <p className="marketing-section-label">Made for product teams</p>
          <h2>Separate the marketing surface from the application surface.</h2>
          <p>
            The landing layer speaks in positioning, conversion, and onboarding. The app layer stays
            focused on auth, setup, and operational attendance data.
          </p>
        </div>

        <div className="marketing-card-grid">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="marketing-info-card">
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="highlights" className="marketing-section marketing-section-inline">
        <div className="marketing-section-copy">
          <p className="marketing-section-label">Highlights</p>
          <h2>A simpler operator experience from signup to attendance logs.</h2>
        </div>
        <ul className="marketing-highlight-list">
          {highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
