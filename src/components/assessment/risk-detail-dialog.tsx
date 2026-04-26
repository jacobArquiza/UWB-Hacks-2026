"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { FriendRiskSummary, GameRiskSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type RiskDialogEntity =
  | { kind: "friend"; item: FriendRiskSummary }
  | { kind: "game"; item: GameRiskSummary }
  | null;

type RiskDetailDialogProps = {
  entity: RiskDialogEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function RiskDetailDialog({
  entity,
  open,
  onOpenChange,
}: RiskDetailDialogProps) {
  const friend = entity?.kind === "friend" ? entity.item : null;
  const game = entity?.kind === "game" ? entity.item : null;
  const item = friend ?? game;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-5xl overflow-hidden rounded-[1.75rem] border border-border bg-popover/96 p-0 text-popover-foreground shadow-[0_36px_120px_rgba(0,0,0,0.24)] lg:max-w-6xl"
        showCloseButton
      >
        {item ? (
          <div className="max-h-[88dvh] overflow-y-auto">
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
                    <Card
                      key={factor.key}
                      className="rounded-[1rem] bg-foreground/[0.025] py-0 ring-1 ring-border shadow-none"
                    >
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {factor.label}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {factor.note}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-8 rounded-full px-3 text-xs self-start",
                            factor.active
                              ? "border-border bg-foreground/[0.08] text-foreground"
                              : "border-border bg-foreground/[0.03] text-muted-foreground",
                          )}
                        >
                          {String(factor.value)}
                        </Badge>
                      </CardContent>
                    </Card>
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
