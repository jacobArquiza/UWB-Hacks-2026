import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/96">
      <div className="shell py-10 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.8fr_1fr]">
          <div className="max-w-[28rem]">
            <p className="font-heading text-[1.1rem] font-semibold text-foreground">
              RoRadar
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Parent-readable Roblox safety snapshots for friends, games, and
              suspicious activity patterns.
            </p>
          </div>

          <div>
            <h2 className="text-[0.72rem] tracking-[0.24em] text-muted-foreground uppercase">
              Product
            </h2>
            <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
              <span>Friend list review</span>
              <span>Game safety scoring</span>
              <span>Downloadable reports</span>
            </div>
          </div>

          <div>
            <h2 className="text-[0.72rem] tracking-[0.24em] text-muted-foreground uppercase">
              Important
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
              <p>
                RoRadar is a parental awareness tool. Scores are informational
                only and may be incomplete or incorrect.
              </p>
              <p>
                RoRadar is independent and not affiliated with Roblox
                Corporation.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} RoRadar. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms of Use
            </Link>
            <span>Use with parent supervision and judgment.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
