"use client";

import { ExternalLink } from "lucide-react";

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
        className="max-h-[84dvh] max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#141518] p-0 text-white shadow-[0_32px_100px_rgba(0,0,0,0.45)] sm:max-w-2xl"
        showCloseButton
      >
        {item ? (
          <div className="flex flex-col">
            <div
              className="rounded-t-[2rem] border-b border-white/8 px-6 py-6"
              style={{
                background: `linear-gradient(135deg, ${getRiskColor(item.score)}22, transparent 48%)`,
              }}
            >
              <DialogHeader className="gap-3">
                <DialogTitle className="font-heading text-3xl text-white">
                  {friend ? friend.displayName : game?.name}
                </DialogTitle>
                <DialogDescription className="max-w-xl text-white/62">
                  {friend
                    ? `@${friend.name} scored ${friend.score}% in the current preview model.`
                    : game
                      ? `${game.creatorName} · ${getRiskLabel(game.level)} · ${game.score}% preview score.`
                      : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span
                  className="rounded-full border px-3 py-1 font-medium"
                  style={{
                    borderColor: `${getRiskColor(item.score)}88`,
                    color: getRiskColor(item.score),
                  }}
                >
                  {getRiskLabel(item.level)}
                </span>
                <span className="text-white/46">
                  Last assessed {formatTimestamp(item.lastAssessed)}
                </span>
                <a
                  href={friend ? friend.profileUrl : game?.robloxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white/72 transition hover:text-white"
                >
                  Open on Roblox
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>

            <div className="px-6 py-5">
              {game ? (
                <div className="mb-6 grid gap-3 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/68 sm:grid-cols-2">
                  <div>Creator: {game.creatorName}</div>
                  <div>Genres: {game.genres.length ? game.genres.join(", ") : "n/a"}</div>
                  <div>
                    Rating:{" "}
                    {game.rating == null ? "n/a" : `${game.rating.toFixed(1)} / 100`}
                  </div>
                  <div>Votes: {formatCompactNumber(game.ratingCount)}</div>
                  <div>
                    Created: {game.created ? formatTimestamp(game.created) : "n/a"}
                  </div>
                  <div>
                    Updated: {game.updated ? formatTimestamp(game.updated) : "n/a"}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <div>
                  <h3 className="font-heading text-sm tracking-[0.24em] text-white/48 uppercase">
                    Scoring factors
                  </h3>
                </div>
                {item.factors.map((factor, index) => (
                  <div key={factor.key}>
                    <div className="grid gap-3 rounded-[1.25rem] border border-white/8 bg-white/[0.025] px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {factor.label}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-white/56">
                            {factor.note}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium",
                            factor.active
                              ? "border-white/14 bg-white/[0.06] text-white"
                              : "border-white/8 bg-white/[0.03] text-white/45",
                          )}
                        >
                          {String(factor.value)}
                        </div>
                      </div>
                    </div>
                    {index < item.factors.length - 1 ? (
                      <Separator className="my-3 bg-white/6" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
