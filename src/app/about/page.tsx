import Link from "next/link";
import { ArrowRight, ShieldAlert, Users, FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const pillars = [
  {
    title: "Audit Friends Lists",
    description:
      "RoRadar reviews account-age patterns, username signals, and possibly predatory network behavior to surface friends that deserve a closer look.",
    icon: Users,
  },
  {
    title: "Evaluate Game Safety",
    description:
      "The platform combines Roblox metadata, community context, online discussion, and risk thresholds to flag games with suspicious signals.",
    icon: ShieldAlert,
  },
  {
    title: "Generate Parent Reports",
    description:
      "Parents get a readable summary that explains what was flagged and why it matters.",
    icon: FileText,
  },
];

const methods = [
  "Roblox profile and connection network analysis",
  "Game-level metadata and public association",
  "Community-sourced warning signals and discussion context",
  "Human-readable reports built for parents, not moderators",
];

const guardrails = [
  "RoRadar is a parental awareness tool, not a law-enforcement or moderation product.",
  "Risk scores are directional signals and should never replace direct parental judgment.",
  "The product is independent and is not affiliated with Roblox Corporation.",
];

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="px-4 pb-14 pt-14 sm:px-6 sm:pb-18 sm:pt-18">
        <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8">
          <Card className="overflow-hidden rounded-[2.25rem] border border-border bg-card/92 shadow-[0_30px_90px_rgba(0,0,0,0.16)]">
            <CardContent className="px-7 py-8 sm:px-10 sm:py-11 lg:px-12 lg:py-14">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_22rem] lg:items-end">
                <div>
                  <p className="text-[0.72rem] font-medium tracking-[0.34em] text-primary uppercase">
                    About RoRadar
                  </p>
                  <h1 className="mt-5 max-w-4xl font-heading text-[2.35rem] leading-[0.98] font-semibold tracking-[-0.06em] text-foreground sm:text-[3rem] lg:text-[4.1rem]">
                    A parental awareness tool for Roblox safety review.
                  </h1>
                  <p className="mt-6 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-[0.98rem]">
                    RoRadar was built around a critical problem: parents hear 
                    all the time about the dangers of roblox, but they don't 
                    know where the risk actually is. They need to be able to  
                    see whether those games, friend networks, or community
                    spaces have already raised safety concerns elsewhere.
                  </p>
                  <p className="mt-4 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-[0.98rem]">
                    The project turns scattered platform signals into a single
                    report that helps a parent decide when to take a closer
                    look, refresh an assessment, or have a conversation before
                    a problem escalates.
                  </p>
                </div>

                <div className="rounded-[1.8rem] border border-border bg-foreground/[0.03] p-6">
                  <p className="text-[0.72rem] tracking-[0.26em] text-muted-foreground uppercase">
                    Project focus
                  </p>
                  <div className="mt-5 grid gap-3 text-sm leading-7 text-muted-foreground">
                    <p>Millions of young Roblox users.</p>
                    <p>Moderation that is often reactive.</p>
                    <p>Parents who need readable context, not raw data.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;

              return (
                <Card
                  key={pillar.title}
                  className="rounded-[1.8rem] border border-border bg-card/88"
                >
                  <CardHeader className="px-6 pt-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-border bg-foreground/[0.03] text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="pt-4 font-heading text-[1.55rem] text-foreground">
                      {pillar.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 text-sm leading-7 text-muted-foreground">
                    {pillar.description}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)]">
            <Card className="rounded-[1.9rem] border border-border bg-card/88">
              <CardHeader className="px-6 pt-6">
                <p className="text-[0.72rem] tracking-[0.24em] text-muted-foreground uppercase">
                  Method
                </p>
                <CardTitle className="pt-2 font-heading text-[2rem] text-foreground">
                  How RoRadar approaches risk
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid gap-3">
                  {methods.map((method) => (
                    <div
                      key={method}
                      className="rounded-[1.2rem] border border-border bg-foreground/[0.02] px-4 py-3 text-sm leading-7 text-muted-foreground"
                    >
                      {method}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border border-border bg-card/88">
              <CardHeader className="px-6 pt-6">
                <p className="text-[0.72rem] tracking-[0.24em] text-muted-foreground uppercase">
                  Guardrails
                </p>
                <CardTitle className="pt-2 font-heading text-[2rem] text-foreground">
                  What the product does not claim
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid gap-3">
                  {guardrails.map((guardrail) => (
                    <div
                      key={guardrail}
                      className="rounded-[1.2rem] border border-[#f0b95f]/18 bg-[#f0b95f]/[0.08] px-4 py-3 text-sm leading-7 text-muted-foreground"
                    >
                      {guardrail}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[2rem] border border-border bg-card/92">
            <CardContent className="flex flex-col gap-5 px-7 py-7 sm:px-10 sm:py-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.72rem] tracking-[0.24em] text-muted-foreground uppercase">
                  Next step
                </p>
                <h2 className="mt-3 font-heading text-[1.8rem] font-semibold tracking-[-0.04em] text-foreground">
                  Run a profile search from the landing page.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  Search a Roblox username to open the parent-facing safety
                  report and see how RoRadar presents risky friends, games, and
                  supporting factors.
                </p>
              </div>

              <Link
                href="/"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex rounded-[1rem] bg-primary px-5 text-primary-foreground shadow-[0_12px_30px_rgba(40,80,255,0.18)] hover:bg-primary/92",
                )}
              >
                Back to Search
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
