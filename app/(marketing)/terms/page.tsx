import type { Metadata } from "next";

import { LegalPage } from "../components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | WHIM",
  description:
    "Read the terms that govern access to WHIM, including account use, admin controls, and platform availability.",
};

const sections = [
  {
    title: "1. Acceptance of terms",
    body: [
      "By accessing or using WHIM, you agree to these Terms of Service. If you use WHIM on behalf of a company, team, or workspace, you confirm that you are authorized to accept these terms for that organization.",
    ],
  },
  {
    title: "2. Accounts and access",
    body: [
      "You are responsible for maintaining accurate account information and for using the product only through authorized sign-in methods. Access may be granted through email authentication, Google sign-in, or other supported login methods made available by WHIM.",
      "Admins can update roles, manage product updates, and deactivate accounts. Deactivated accounts may lose access immediately.",
    ],
  },
  {
    title: "3. Acceptable use",
    body: [
      "You agree not to misuse the service, interfere with the product, attempt unauthorized access, share personal shortcut URLs in unsafe ways, or use WHIM for unlawful, fraudulent, or abusive activity.",
    ],
  },
  {
    title: "4. Attendance records and automations",
    body: [
      "WHIM helps log attendance using shortcut URLs, calendar settings, and manual updates. You are responsible for configuring your automations and verifying that the information recorded for your workspace is accurate.",
      "The product may use saved rules such as weekly off settings and leave planning to present calendar state and attendance summaries.",
    ],
  },
  {
    title: "5. Availability",
    body: [
      "We aim to keep WHIM available and reliable, but we do not guarantee uninterrupted access. Maintenance, infrastructure issues, provider outages, or security controls may temporarily affect availability.",
    ],
  },
  {
    title: "6. Intellectual property",
    body: [
      "WHIM, including its branding, UI, software, and related materials, remains the property of its owners and licensors. These terms do not transfer any ownership rights to you other than the limited right to use the service as intended.",
    ],
  },
  {
    title: "7. Termination",
    body: [
      "You may stop using the product at any time. We may suspend or terminate access if these terms are violated, if an admin disables your account, or if continued access creates legal, security, or operational risk.",
    ],
  },
  {
    title: "8. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, WHIM is provided on an as-is basis. We are not liable for indirect, incidental, special, consequential, or punitive damages, or for losses arising from product downtime, inaccurate configurations, or third-party provider failures.",
    ],
  },
  {
    title: "9. Changes to these terms",
    body: [
      "We may update these terms from time to time. When we do, the updated version will be posted on this page with a revised effective date. Continued use of WHIM after the update means you accept the revised terms.",
    ],
  },
] satisfies Parameters<typeof LegalPage>[0]["sections"];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of service"
      intro="The rules that govern access to WHIM, including account use, admin controls, and platform availability."
      lastUpdated="Last updated: 18 April 2026"
      sections={sections}
    />
  );
}
