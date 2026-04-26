import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

const effectiveDate = "April 25, 2026";

export const metadata: Metadata = {
  title: "Terms of Use | RoRadar",
  description: "Terms of use for the RoRadar parental awareness tool.",
};

const sections = [
  {
    title: "Use of the service",
    body: [
      "RoRadar is provided as a parental awareness and review tool. You may use it to search Roblox usernames, inspect generated safety snapshots, save profiles to your account dashboard, and review supporting evidence when those features are enabled.",
      "You agree to use RoRadar lawfully and responsibly. You may not use the service to harass, stalk, misrepresent, exploit, or unlawfully surveil other people.",
    ],
  },
  {
    title: "Nature of the scores and reports",
    body: [
      "RoRadar produces informational scores, summaries, and supporting evidence based on available public data and configured third-party services. Those outputs are directional signals only.",
      "RoRadar does not guarantee that a user, friend, or game is safe or unsafe. Scores are not moderation verdicts, legal findings, or factual accusations.",
    ],
  },
  {
    title: "Accounts and saved data",
    body: [
      "If authentication is enabled, you are responsible for maintaining the confidentiality of your login session and any saved child profiles associated with your account.",
      "You are also responsible for reviewing whether the storage, search, and AI providers configured in your deployment are appropriate for your intended use.",
    ],
  },
  {
    title: "Third-party dependencies",
    body: [
      "RoRadar depends on third-party providers and public data sources, including Roblox and optional services used for sign-in, stored data, deeper web search, and automated evidence review. RoRadar is not responsible for outages, policy changes, incomplete responses, or data quality issues originating from those providers.",
      "RoRadar is independent and is not affiliated with Roblox Corporation.",
    ],
  },
  {
    title: "No warranties",
    body: [
      "RoRadar is provided on an \"as is\" and \"as available\" basis. To the maximum extent permitted by law, RoRadar disclaims warranties of accuracy, completeness, fitness for a particular purpose, non-infringement, and uninterrupted availability.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "To the maximum extent permitted by law, RoRadar and its operators will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages arising from the use of the service or reliance on any report, score, or supporting evidence.",
    ],
  },
  {
    title: "Changes to the service or terms",
    body: [
      "RoRadar may modify or discontinue features, integrations, or report formats at any time. These Terms may also be updated from time to time. Continued use of the service after an update constitutes acceptance of the revised Terms.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms of Use"
      title="The operating rules for using RoRadar responsibly."
      effectiveDate={effectiveDate}
      intro={[
        "These Terms of Use govern access to and use of RoRadar.",
        "By using RoRadar, you agree that the product is a parent-facing informational tool and that you remain responsible for your own decisions, supervision, and interpretation of any generated report.",
      ]}
      sections={sections.map((section) => ({
        ...section,
        body: [...section.body],
      }))}
    />
  );
}
