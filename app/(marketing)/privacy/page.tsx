import type { Metadata } from "next";

import { LegalPage } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | WHIM",
  description:
    "Learn how WHIM collects, uses, and protects account, attendance, and shortcut data.",
};

const sections = [
  {
    title: "1. What we collect",
    body: [
      "We collect the account details you provide during signup, such as your name and email address. When you use the product, we also store workspace settings, shortcut tokens, attendance entries, leave and work-from-home records, and product update activity created by admins.",
      "If you sign in with Google, we receive the profile details that Google shares with your consent, typically your name, email address, and profile photo metadata.",
    ],
  },
  {
    title: "2. How we use information",
    body: [
      "We use your information to create your WHIM account, power attendance tracking, generate personal shortcut URLs, show your calendar and dashboard history, and help admins manage access and product updates.",
      "We also use technical data required for authentication, security, abuse prevention, and essential product diagnostics.",
    ],
  },
  {
    title: "3. Shortcut and attendance data",
    body: [
      "Arrival and leave shortcut URLs are tied to your account through a personal token. When those shortcuts run, WHIM records the related attendance event and associates it with your dashboard.",
      "Weekly off rules, leave planning, and work-from-home settings are stored so the product can render your calendar correctly and keep your attendance state consistent over time.",
    ],
  },
  {
    title: "4. Sharing and processors",
    body: [
      "We do not sell your personal data. We use third-party infrastructure providers such as Supabase for authentication and database services, Vercel for hosting, Google for optional sign-in, and Brevo or similar providers for transactional emails.",
      "These providers process data only to operate the product and the supporting infrastructure around it.",
    ],
  },
  {
    title: "5. Retention",
    body: [
      "We keep account and attendance data for as long as your workspace remains active or as needed to provide the service. If an account is deactivated, some records may remain in backup or audit systems for a limited period where reasonably required for security, compliance, or recovery.",
    ],
  },
  {
    title: "6. Your choices",
    body: [
      "You can request access corrections or account removal by contacting us. Admins may also deactivate user access from the admin panel, which prevents future sign-ins while preserving the existing operational records needed by the workspace.",
    ],
  },
  {
    title: "7. Security",
    body: [
      "We use authentication, role-based access controls, and managed infrastructure services to protect your data. No system is perfectly secure, but we aim to use reasonable safeguards appropriate for the product.",
    ],
  },
  {
    title: "8. Contact",
    body: [
      "For privacy questions, requests, or concerns, contact the WHIM team through the support address or the workspace owner who invited you to the product.",
    ],
  },
] satisfies Parameters<typeof LegalPage>[0]["sections"];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy policy"
      intro="How WHIM handles account, attendance, and shortcut data across the product."
      lastUpdated="Last updated: 18 April 2026"
      sections={sections}
    />
  );
}
