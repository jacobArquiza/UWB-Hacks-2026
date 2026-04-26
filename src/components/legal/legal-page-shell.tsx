import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LegalSection = {
  title: string;
  body: ReactNode[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  intro: ReactNode[];
  effectiveDate: string;
  sections: LegalSection[];
};

export function LegalPageShell({
  eyebrow,
  title,
  intro,
  effectiveDate,
  sections,
}: LegalPageShellProps) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="px-4 pb-14 pt-14 sm:px-6 sm:pb-18 sm:pt-18">
        <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-6">
          <Card className="overflow-hidden rounded-[2.25rem] border border-border bg-card/92 shadow-[0_30px_90px_rgba(0,0,0,0.16)]">
            <CardContent className="px-7 py-8 sm:px-10 sm:py-11 lg:px-12 lg:py-14">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_19rem] lg:items-start">
                <div>
                  <p className="text-[0.72rem] font-medium tracking-[0.34em] text-primary uppercase">
                    {eyebrow}
                  </p>
                  <h1 className="mt-5 max-w-4xl font-heading text-[2.35rem] leading-[0.98] font-semibold tracking-[-0.06em] text-foreground sm:text-[3rem] lg:text-[4.1rem]">
                    {title}
                  </h1>
                  <div className="mt-6 grid gap-4 text-sm leading-8 text-muted-foreground sm:text-[0.98rem]">
                    {intro.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-border bg-foreground/[0.03] p-6">
                  <p className="text-[0.72rem] tracking-[0.26em] text-muted-foreground uppercase">
                    Effective date
                  </p>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {effectiveDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {sections.map((section) => (
              <Card
                key={section.title}
                className="rounded-[1.9rem] border border-border bg-card/88"
              >
                <CardHeader className="px-6 pt-6">
                  <p className="text-[0.72rem] tracking-[0.24em] text-muted-foreground uppercase">
                    Section
                  </p>
                  <CardTitle className="pt-2 font-heading text-[1.8rem] text-foreground">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 px-6 pb-6 text-sm leading-7 text-muted-foreground">
                  {section.body.map((paragraph, index) => (
                    <div key={index}>{paragraph}</div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
