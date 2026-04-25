import { Shield, UsersRound, Video } from "lucide-react";

import { SearchHero } from "@/components/landing/search-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const landingHighlights = [
  {
    title: "Live Roblox identity lookup",
    copy: "Phase 0 resolves real profile information for KingRobloxsian20 so the assessment flow feels grounded immediately.",
    icon: UsersRound,
  },
  {
    title: "Parent-readable risk cards",
    copy: "Risk is translated into concise explanations, timestamps, and modals instead of raw API fragments.",
    icon: Shield,
  },
  {
    title: "Seeded game watchlist",
    copy: "Grow a Garden is wired into the demo so the high-risk game UI is fully clickable before P2 scoring lands.",
    icon: Video,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex min-h-[calc(100dvh-4rem)] items-center px-4 py-20">
        <div className="shell">
          <SearchHero />
        </div>
      </section>

      <section id="preview" className="pb-12">
        <div className="shell grid gap-4 md:grid-cols-3">
          {landingHighlights.map((item) => (
            <Card
              key={item.title}
              className="rounded-[1.8rem] border border-white/10 bg-[#141518]"
            >
              <CardHeader className="px-5 pt-5">
                <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <item.icon className="size-4 text-white/76" />
                </div>
                <CardTitle className="font-heading text-2xl text-white">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 text-sm leading-7 text-white/58">
                {item.copy}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="approach" className="pb-20">
        <div className="shell rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
            Approach
          </p>
          <h2 className="mt-4 max-w-3xl font-heading text-4xl text-white sm:text-5xl">
            Parents do not need another moderation dashboard.
          </h2>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-white/60 sm:text-base">
            They need a direct answer: who is this child playing with, which
            games deserve a closer look, and what exactly made RoRadar uneasy.
            This first phase focuses on that experience first, then layers in the
            heavier scoring pipelines later.
          </p>
        </div>
      </section>
    </div>
  );
}
