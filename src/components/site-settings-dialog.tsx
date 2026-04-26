"use client";

import type { ReactNode } from "react";
import {
  Globe,
  MoonStar,
  RotateCcw,
  Settings2,
  SunMedium,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePreferences } from "@/components/preferences-provider";
import { cn } from "@/lib/utils";

function SettingCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-border bg-foreground/[0.03] p-4">
      <div className="grid gap-4">
        <div className="max-w-[34rem]">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

export function SiteSettingsDialog() {
  const {
    theme,
    reducedMotion,
    wideWebSearchEnabled,
    setTheme,
    setReducedMotion,
    setWideWebSearchEnabled,
    resetPreferences,
  } = usePreferences();

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Open settings"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "rounded-[0.95rem] border-border bg-foreground/[0.03] px-3 text-foreground hover:bg-foreground/[0.06] sm:h-9 sm:px-4",
        )}
      >
        <Settings2 className="size-4" />
        <span className="hidden sm:inline">Settings</span>
      </DialogTrigger>

      <DialogContent
        className={cn(
          "w-[calc(100vw-1rem)] max-w-3xl max-h-[calc(100dvh-1rem)] overflow-hidden rounded-[1.5rem] border p-0 text-popover-foreground backdrop-blur-xl sm:w-[calc(100vw-2rem)] sm:rounded-[1.75rem]",
          theme === "light"
            ? "border-black/8 bg-white/96 shadow-[0_26px_80px_rgba(50,70,110,0.16)]"
            : "border-border bg-popover/96 shadow-[0_30px_100px_rgba(0,0,0,0.24)]",
        )}
      >
        <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden">
          <DialogHeader className="gap-3 border-b border-border/70 px-5 pb-4 pt-5 pr-12 sm:px-7 sm:pb-5 sm:pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <DialogTitle className="font-heading text-[1.45rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[1.85rem]">
                Settings
              </DialogTitle>
              <Badge
                variant="outline"
                className="h-7 rounded-full border-border bg-foreground/[0.03] px-3 text-[0.66rem] tracking-[0.18em] uppercase"
              >
                This device
              </Badge>
            </div>
            <DialogDescription className="max-w-xl text-sm leading-6 text-muted-foreground sm:leading-7">
              Control appearance and interaction preferences on this device.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 overflow-y-auto overscroll-contain px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
            <SettingCard
              title="Theme"
              description="Switch between the darker monitoring view and a cleaner light workspace."
            >
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                size="lg"
                className={cn(
                  "min-w-[7.25rem] rounded-[0.95rem]",
                  theme === "dark"
                    ? "bg-primary text-primary-foreground hover:bg-primary/92"
                    : "border-border bg-transparent text-foreground hover:bg-foreground/[0.05]",
                )}
                onClick={() => setTheme("dark")}
              >
                <MoonStar className="size-4" />
                Dark
              </Button>
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                size="lg"
                className={cn(
                  "min-w-[7.25rem] rounded-[0.95rem]",
                  theme === "light"
                    ? "bg-primary text-primary-foreground hover:bg-primary/92"
                    : "border-border bg-transparent text-foreground hover:bg-foreground/[0.05]",
                )}
                onClick={() => setTheme("light")}
              >
                <SunMedium className="size-4" />
                Light
              </Button>
            </SettingCard>

            <SettingCard
              title="Reduced motion"
              description="Calm down transitions and visual movement if you want a more static interface."
            >
              <Button
                type="button"
                variant={reducedMotion ? "default" : "outline"}
                size="lg"
                className={cn(
                  "min-w-[8.5rem] rounded-[0.95rem]",
                  reducedMotion
                    ? "bg-primary text-primary-foreground hover:bg-primary/92"
                    : "border-border bg-transparent text-foreground hover:bg-foreground/[0.05]",
                )}
                onClick={() => setReducedMotion(!reducedMotion)}
              >
                <Waves className="size-4" />
                {reducedMotion ? "Enabled" : "Disabled"}
              </Button>
            </SettingCard>

            <SettingCard
              title="Wide web safety search"
              description="Control deeper article searches on game detail refreshes. Turn them off if you want to avoid extra live searches."
            >
              <Button
                type="button"
                variant={wideWebSearchEnabled ? "default" : "outline"}
                size="lg"
                className={cn(
                  "min-w-[9.25rem] rounded-[0.95rem]",
                  wideWebSearchEnabled
                    ? "bg-primary text-primary-foreground hover:bg-primary/92"
                    : "border-border bg-transparent text-foreground hover:bg-foreground/[0.05]",
                )}
                onClick={() => setWideWebSearchEnabled(!wideWebSearchEnabled)}
              >
                <Globe className="size-4" />
                {wideWebSearchEnabled ? "Enabled" : "Disabled"}
              </Button>
            </SettingCard>

            <div className="mt-2 grid gap-3 rounded-[1.2rem] border border-border bg-foreground/[0.02] px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <p className="text-sm leading-6 text-muted-foreground">
                Reset returns the interface to the default RoRadar appearance.
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="rounded-[0.95rem] text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                  onClick={resetPreferences}
                >
                  <RotateCcw className="size-4" />
                  Reset
                </Button>
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="rounded-[0.95rem] border-border bg-transparent text-foreground hover:bg-foreground/[0.05]"
                    />
                  }
                >
                  Close
                </DialogClose>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
