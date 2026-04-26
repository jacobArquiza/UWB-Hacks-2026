import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

const effectiveDate = "April 25, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | RoRadar",
  description: "Privacy practices for the RoRadar parental awareness tool.",
};

const sections = [
  {
    title: "What RoRadar collects",
    body: [
      "RoRadar can collect information you provide directly, such as the Roblox usernames you search, the child profiles you choose to save to your dashboard, and the account details associated with your login session when authentication is enabled.",
      "The app can also store product data generated during use, such as saved-child records, assessment snapshots, cached wide web search results, and preference settings used to control features like wide web searching.",
    ],
  },
  {
    title: "How RoRadar uses data",
    body: [
      "RoRadar uses this information to generate parental-awareness reports, save child profiles to an authenticated dashboard, cache expensive wide web safety searches, and improve reliability of the assessment experience.",
      "RoRadar is designed as an informational triage tool for parents. The data is used to explain flagged signals and preserve user-requested functionality, not to provide identity verification, law-enforcement conclusions, or moderation decisions.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "RoRadar relies on third-party services to operate. Depending on the features enabled, these may include services for account sign-in, application data storage, profile and game lookup, deeper web search, and automated evidence review.",
      "Those providers may process the data necessary to fulfill their role. If you deploy RoRadar yourself, you are responsible for reviewing the terms and privacy practices of the services you configure.",
    ],
  },
  {
    title: "Cookies and device storage",
    body: [
      "RoRadar may use cookies or similar session mechanisms to support account sign-in. It also uses on-device storage for client-side preferences and as a fallback store when account-backed saving is unavailable.",
    ],
  },
  {
    title: "Data sharing",
    body: [
      "RoRadar does not present itself as a public social platform, and the application is intended to keep parent-facing report data within the context of the signed-in account or the device where it was saved.",
      "RoRadar may disclose information if required by law, to respond to a valid legal process, or to protect the integrity, security, or operation of the service.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "RoRadar retains saved-child records, cached assessment support data, and related operational records for as long as they remain useful to the configured deployment, unless they are removed by the operator or overwritten by newer data.",
      "If you are running this project yourself, you control the configured storage backends and are responsible for defining any deletion, export, or retention policy that your deployment requires.",
    ],
  },
  {
    title: "Children's privacy",
    body: [
      "RoRadar is built as a parent-facing awareness tool and is not intended for unsupervised use by children. The app may process public Roblox information relating to child accounts only to generate parent-readable safety snapshots requested by a parent or guardian.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy Policy"
      title="How RoRadar handles parent-facing product data."
      effectiveDate={effectiveDate}
      intro={[
        "This Privacy Policy describes how RoRadar collects, uses, stores, and shares information when you use the product.",
        "RoRadar is a parental awareness tool for Roblox safety review. It is designed to help parents inspect public platform signals and supporting evidence, not to replace direct supervision or legal judgment.",
      ]}
      sections={sections.map((section) => ({
        ...section,
        body: [...section.body],
      }))}
    />
  );
}
