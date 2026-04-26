"use client";

import Image from "next/image";
import { CircleHelp, ExternalLink, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCompactNumber, formatTimestamp } from "@/lib/format";
import { getRiskColor, getRiskLabel } from "@/lib/risk";
import type { FriendRiskSummary, GameRiskSummary, RiskFactor } from "@/lib/types";
import { cn } from "@/lib/utils";

type RiskDialogEntity =
  | { kind: "friend"; item: FriendRiskSummary }
  | { kind: "game"; item: GameRiskSummary }
  | null;

type RiskDetailDialogProps = {
  entity: RiskDialogEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gemmaWideWebConfigured?: boolean;
  onRefreshWideWeb?: () => void;
  wideWebLiveSearchStage?: "tavily" | "gemma" | null;
  wideWebRefreshPending?: boolean;
};

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 rounded-[1rem] border border-border bg-foreground/[0.025] px-4 py-3">
      <p className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm leading-6 text-foreground/80">{value}</p>
    </div>
  );
}

function formatFactorValue(value: RiskFactor["value"]) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function formatContribution(contribution: number) {
  return `${contribution.toFixed(1).replace(/\.0$/, "")} pts`;
}

function FactorNote({
  label,
  note,
}: {
  label: string;
  note: string;
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      <button
        type="button"
        aria-label={`${label} details`}
        className="inline-flex size-5 items-center justify-center rounded-full border border-border bg-foreground/[0.04] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <CircleHelp className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-72 max-w-[min(18rem,calc(100vw-5rem))] rounded-[0.85rem] border border-border bg-popover px-3 py-2 text-xs leading-5 text-muted-foreground opacity-0 shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition-opacity duration-200 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 sm:left-1/2 sm:-translate-x-1/2"
      >
        {note}
      </span>
    </span>
  );
}

function FactorRow({
  factor,
  gemmaWideWebConfigured = false,
  onRefreshWideWeb,
  wideWebLiveSearchStage = null,
  wideWebRefreshPending = false,
}: {
  factor: RiskFactor;
  gemmaWideWebConfigured?: boolean;
  onRefreshWideWeb?: () => void;
  wideWebLiveSearchStage?: "tavily" | "gemma" | null;
  wideWebRefreshPending?: boolean;
}) {
  const isWideWebFactor = factor.key === "wide-web-safety-search";
  const isTavilyStage = isWideWebFactor && wideWebLiveSearchStage === "tavily";
  const isGemmaStage = isWideWebFactor && wideWebLiveSearchStage === "gemma";

  return (
    <Card
      className={cn(
        "overflow-visible rounded-[1rem] py-0 shadow-none",
        isTavilyStage
          ? "bg-sky-500/[0.08] ring-2 ring-sky-400/35 shadow-[0_0_32px_rgba(56,189,248,0.14)]"
          : isGemmaStage
            ? "bg-emerald-500/[0.08] ring-2 ring-emerald-400/35 shadow-[0_0_32px_rgba(52,211,153,0.14)]"
          : isWideWebFactor
            ? "bg-emerald-500/[0.05] ring-1 ring-emerald-400/20"
          : "bg-foreground/[0.025] ring-1 ring-border",
      )}
    >
      <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(8.5rem,auto)_minmax(7rem,auto)] sm:items-start sm:gap-x-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{factor.label}</p>
              <FactorNote label={factor.label} note={factor.note} />
            </div>
            {isWideWebFactor && onRefreshWideWeb ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-border bg-foreground/[0.03] px-3 text-[0.68rem] tracking-[0.12em] uppercase hover:bg-foreground/[0.06]"
                onClick={onRefreshWideWeb}
                disabled={wideWebRefreshPending}
              >
                <RefreshCw
                  className={
                    wideWebRefreshPending
                      ? `size-3 animate-spin ${
                          isTavilyStage ? "text-sky-500" : "text-emerald-500"
                        }`
                      : "size-3"
                  }
                />
                Refresh search
              </Button>
            ) : null}
          </div>
          {isWideWebFactor && (isTavilyStage || isGemmaStage) ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.72rem] font-medium",
                  isTavilyStage
                    ? "border border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-200"
                    : "border border-sky-400/20 bg-sky-500/5 text-sky-700/70 dark:text-sky-200/70",
                )}
              >
                <span className="relative flex size-2.5">
                  {isTavilyStage ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  ) : null}
                  <span
                    className={cn(
                      "relative inline-flex size-2.5 rounded-full",
                      isTavilyStage ? "bg-sky-400" : "bg-sky-400/65",
                    )}
                  />
                </span>
                Searching the web
              </div>
              {gemmaWideWebConfigured ? (
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.72rem] font-medium",
                    isGemmaStage
                      ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                      : "border border-emerald-400/20 bg-emerald-500/5 text-emerald-700/70 dark:text-emerald-200/70",
                  )}
                >
                  <span className="relative flex size-2.5">
                    {isGemmaStage ? (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    ) : null}
                    <span
                      className={cn(
                        "relative inline-flex size-2.5 rounded-full",
                        isGemmaStage ? "bg-emerald-400" : "bg-emerald-400/65",
                      )}
                    />
                  </span>
                  Reviewing evidence
                </div>
              ) : null}
            </div>
          ) : null}
          {factor.observedSignals?.length ? (
            <ul className="mt-2 grid gap-1.5 pl-5 text-sm leading-6 text-muted-foreground list-disc">
              {factor.observedSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          ) : null}
          {factor.observedSources?.length ? (
            <div className="mt-3">
              <p className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
                Source pages
              </p>
              <ul className="mt-2 grid gap-1.5 pl-5 text-sm leading-6 text-muted-foreground list-disc">
                {factor.observedSources.map((source) => (
                  <li key={`${source.label}-${source.url}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-foreground/80 transition-colors hover:text-foreground"
                    >
                      <span>{source.label}</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
            Observed value
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground/80">
            {formatFactorValue(factor.value)}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase">
            Contribution
          </p>
          <p
            className={cn(
              "mt-1 text-base font-semibold",
              factor.contribution > 0
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {formatContribution(factor.contribution)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskDetailDialog({
  entity,
  open,
  onOpenChange,
  gemmaWideWebConfigured = false,
  onRefreshWideWeb,
  wideWebLiveSearchStage = null,
  wideWebRefreshPending = false,
}: RiskDetailDialogProps) {
  const friend = entity?.kind === "friend" ? entity.item : null;
  const game = entity?.kind === "game" ? entity.item : null;
  const item = friend ?? game;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-5xl overflow-visible rounded-[1.75rem] border border-border bg-popover/96 p-0 text-popover-foreground shadow-[0_36px_120px_rgba(0,0,0,0.24)] lg:max-w-6xl"
        showCloseButton
      >
        {item ? (
          <div className="max-h-[88dvh] overflow-x-visible overflow-y-auto">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
                <div className="space-y-4">
                  <a
                    href={friend ? friend.profileUrl : game?.robloxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-[1.4rem] border border-border bg-foreground/[0.04] transition-opacity hover:opacity-88"
                  >
                    {friend ? (
                      <Image
                        src={friend.avatarUrl}
                        alt={friend.displayName}
                        width={440}
                        height={440}
                        className="aspect-square w-full object-cover"
                      />
                    ) : game ? (
                      <Image
                        src={game.thumbnailUrl}
                        alt={game.name}
                        width={520}
                        height={520}
                        className="aspect-square w-full object-cover"
                      />
                    ) : null}
                  </a>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="h-8 rounded-full border-border bg-foreground/[0.04] px-3.5 text-[0.68rem] tracking-[0.18em] uppercase"
                      style={{ color: getRiskColor(item.score) }}
                    >
                      {item.score}% {getRiskLabel(item.level)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="h-8 rounded-full border-border bg-foreground/[0.04] px-3.5 text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase"
                    >
                      Last assessed {formatTimestamp(item.lastAssessed)}
                    </Badge>
                  </div>

                  <a
                    href={friend ? friend.profileUrl : game?.robloxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Open on Roblox
                    <ExternalLink className="size-4" />
                  </a>
                </div>

                <div className="space-y-6">
                  <DialogHeader className="gap-3 text-left">
                    <p className="text-[0.72rem] tracking-[0.2em] text-muted-foreground uppercase">
                      {friend ? "Friend detail" : "Game detail"}
                    </p>
                    <DialogTitle className="font-heading text-[2.1rem] leading-[0.94] font-semibold tracking-[-0.05em] text-foreground sm:text-[2.45rem] lg:text-[2.9rem]">
                      {friend ? friend.displayName : game?.name}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                      {friend
                        ? `@${friend.name}`
                        : `${game?.creatorName ?? "Unknown creator"}`}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-3 md:grid-cols-2">
                    {friend ? (
                      <>
                        <MetaRow label="Username" value={`@${friend.name}`} />
                        <MetaRow
                          label="Account age"
                          value={`${friend.accountAgeDays} days`}
                        />
                        <MetaRow
                          label="Preview score"
                          value={`${friend.score}% suspicious`}
                        />
                        <MetaRow
                          label="Profile link"
                          value="Open the Roblox profile directly for manual review."
                        />
                      </>
                    ) : game ? (
                      <>
                        <MetaRow label="Creator" value={game.creatorName} />
                        <MetaRow
                          label="Genres"
                          value={game.genres.length ? game.genres.join(", ") : "n/a"}
                        />
                        <MetaRow
                          label="Rating"
                          value={
                            game.rating == null
                              ? "n/a"
                              : `${game.rating.toFixed(1)} / 100`
                          }
                        />
                        <MetaRow
                          label="Votes"
                          value={formatCompactNumber(game.ratingCount)}
                        />
                        <MetaRow
                          label="Created"
                          value={game.created ? formatTimestamp(game.created) : "n/a"}
                        />
                        <MetaRow
                          label="Updated"
                          value={game.updated ? formatTimestamp(game.updated) : "n/a"}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <Separator className="my-6 bg-border" />

              <div className="space-y-4">
                <h3 className="text-[0.72rem] tracking-[0.2em] text-muted-foreground uppercase">
                  Scoring factors
                </h3>
                <div className="grid gap-3">
                  {item.factors.map((factor) => (
                    <FactorRow
                      key={factor.key}
                      factor={factor}
                      gemmaWideWebConfigured={gemmaWideWebConfigured}
                      onRefreshWideWeb={
                        factor.key === "wide-web-safety-search"
                          ? onRefreshWideWeb
                          : undefined
                      }
                      wideWebLiveSearchStage={wideWebLiveSearchStage}
                      wideWebRefreshPending={wideWebRefreshPending}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
