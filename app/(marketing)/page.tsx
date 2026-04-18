import { MarketingPageShell } from "./components/marketing-page-shell";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const setupMetrics = [
  {
    value: "~2 min",
    label: "From signup to first check-in",
  },
  {
    value: "0 apps",
    label: "No extra download required",
  },
  {
    value: "1 URL",
    label: "That does everything",
  },
];

const onboardingSteps = [
  {
    index: "01",
    title: "Create account",
    copy: "Email and password. That's it. No forms, no setup calls.",
    meta: "~30 sec",
  },
  {
    index: "02",
    title: "Get your URL",
    copy: "One URL for IN. One for OUT. Both ready instantly.",
    meta: "Instant",
  },
  {
    index: "03",
    title: "Paste into Shortcuts",
    copy: "Open iPhone Shortcuts. Paste. Takes 60 seconds.",
    meta: "~60 sec",
  },
  {
    index: "04",
    title: "Done",
    copy: "Walk in. Walk out. Dashboard updated.",
    meta: "Forever",
  },
];

const audiences = [
  {
    title: "Workplaces with no proper system",
    copy: "No login machine. No HR software. Paste a URL and your office has attendance from today.",
    icon: (
      <svg
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="10" height="9" rx="2" />
        <path d="M4 1.5v3M10 1.5v3M2 6h10" />
      </svg>
    ),
  },
  {
    title: "Teams where tracking is too hectic",
    copy: "Stop chasing people for updates. Your phone marks you present the moment you arrive.",
    icon: (
      <svg
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="4" r="2.5" />
        <path d="M2.5 12c.8-2.3 2.3-3.5 4.5-3.5S10.7 9.7 11.5 12" />
      </svg>
    ),
  },
  {
    title: "People planning their month",
    copy: "See your leave, your WFH days, your full attendance, all in one place before the month ends.",
    icon: (
      <svg
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="7" cy="7" r="5" />
        <path d="M7 4v3l2 2" />
      </svg>
    ),
  },
  {
    title: "Anyone who wants to know their pattern",
    copy: "How many days did you actually come in? Your dashboard already knows.",
    icon: (
      <svg
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 10l3-3 2 2 5-6" />
      </svg>
    ),
  },
];

const essentials = [
  "No extra app on your phone",
  "Works from day one, no training needed",
  "Private dashboard per person",
  "Plan leave and WFH in advance",
  "Real-time, updates the second you arrive",
  "Nothing to maintain, nothing to break",
];

type ProductUpdate = {
  meta: string;
  date: string;
  time: string;
  title: string;
  copy: string;
};

async function getProductUpdates(): Promise<ProductUpdate[]> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("product_updates")
      .select("meta, title, copy, published_at")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(6);

    if (error || !data?.length) {
      return [];
    }

    return data.map((update) => {
      const publishedDate = new Date(update.published_at as string);

      return {
        meta: update.meta,
        date: new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
        }).format(publishedDate),
        time: new Intl.DateTimeFormat("en-IN", {
          timeStyle: "short",
        }).format(publishedDate),
        title: update.title,
        copy: update.copy,
      };
    });
  } catch {
    return [];
  }
}

function CheckIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 5.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

export default async function LandingPage() {
  const updates = await getProductUpdates();

  return (
    <MarketingPageShell className="marketing-home-page">
      <section className="marketing-home-hero">
        <h1 className="marketing-home-title">
          Turn iPhone automations
          <br />
          into a <em>live dashboard.</em>
        </h1>

        <p className="marketing-home-copy">
          Fixed shortcut URLs. Private dashboards. No backend keys in the
          client, no manual setup.
        </p>

        <div className="marketing-home-metric-row">
          {setupMetrics.map((metric) => (
            <article key={metric.label} className="marketing-home-metric-card">
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-home-section">
        <h2 className="marketing-home-section-title">
          Two minutes.
          <br />
          Then{" "}
          <em className="marketing-home-title-chip">
            never think about it
          </em>{" "}
          again.
        </h2>
        <p className="marketing-home-section-copy">
          Email and password to get started. One URL to paste. Your iPhone does
          the rest every single day.
        </p>
        <div className="marketing-home-step-grid">
          {onboardingSteps.map((step) => (
            <article key={step.index} className="marketing-home-step-card">
              <span className="marketing-home-step-index">{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
              <span className="marketing-home-step-meta">{step.meta}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-home-section" id="benefits">
        <h2 className="marketing-home-section-title">
          Built for people
          <br />
          who just want it{" "}
          <em className="marketing-home-title-chip">to work.</em>
        </h2>
        <p className="marketing-home-section-copy">
          No IT setup. No training. Works for a team of one or a full office.
        </p>
        <div className="marketing-home-audience-grid">
          {audiences.map((audience) => (
            <article
              key={audience.title}
              className="marketing-home-audience-card"
            >
              <div className="marketing-home-audience-icon">
                {audience.icon}
              </div>
              <h3>{audience.title}</h3>
              <p>{audience.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-home-section" id="highlights">
        <h2 className="marketing-home-section-title">
          Everything you need.
          <br />
          <em className="marketing-home-title-chip">Nothing you don't.</em>
        </h2>
        <p className="marketing-home-section-copy">
          No training. No maintenance. No extra app. Just attendance that works
          every day.
        </p>
        <div className="marketing-home-essential-grid">
          {essentials.map((item) => (
            <div key={item} className="marketing-home-essential-card">
              <div className="marketing-home-highlight-check">
                <CheckIcon />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="marketing-home-section" id="updates">
        <h2 className="marketing-home-section-title">
          Product updates.
          <br />
          <em className="marketing-home-title-chip">Shipped in public.</em>
        </h2>
        <p className="marketing-home-section-copy">
          Recent changes across the marketing surface and the product flow.
        </p>
        {updates.length ? (
          <div className="marketing-home-update-grid">
            {updates.map((update) => (
              <article key={update.title} className="marketing-home-update-card">
                <div className="marketing-home-update-top">
                  <span className="marketing-home-update-tag">{update.meta}</span>
                  <time className="marketing-home-update-time" dateTime={update.date}>
                    {update.date} · {update.time}
                  </time>
                </div>
                <h3>{update.title}</h3>
                <p>{update.copy}</p>
              </article>
            ))}
          </div>
        ) : (
          <article className="marketing-home-update-card">
            <div className="marketing-home-update-top">
              <span className="marketing-home-update-tag">No updates yet</span>
            </div>
            <h3>The changelog is empty for this project.</h3>
            <p>Publish your first product update from the admin portal and it will appear here.</p>
          </article>
        )}
      </section>
    </MarketingPageShell>
  );
}
