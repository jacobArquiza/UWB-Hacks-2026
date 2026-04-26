"use client";

import Image from "next/image";
import { useState, useTransition, type ReactNode } from "react";
import {
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldAlert,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";

import { ReportPreviewDialog } from "@/components/assessment/report-preview-dialog";
import { RiskDetailDialog } from "@/components/assessment/risk-detail-dialog";
import { usePreferences } from "@/components/preferences-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  surfacedGameLimit,
  surfacedRiskThreshold,
} from "@/lib/assessment-thresholds";
import { formatTimestamp } from "@/lib/format";
import { getRiskColor, getRiskLabel } from "@/lib/risk";
import { upsertSavedChild } from "@/lib/saved-children";
import type {
  FriendRiskSummary,
  GameRiskSummary,
  SavedChildProfile,
  UserAssessment,
  WideWebSearchMode,
} from "@/lib/types";

type AssessmentShellProps = {
  initialAssessment: UserAssessment;
  authConfigured: boolean;
  gemmaWideWebConfigured: boolean;
  isLoggedIn: boolean;
};

type RefreshScope = "profile" | "friends" | "games";
type DialogSelection =
  | { kind: "friend"; item: FriendRiskSummary }
  | { kind: "game"; item: GameRiskSummary }
  | null;
type WideWebLiveSearchStage = "tavily" | "gemma" | null;

function SectionHeader({
  title,
  lastAssessed,
  refreshing,
  onRefresh,
  actions,
}: {
  title: string;
  lastAssessed: string;
  refreshing: boolean;
  onRefresh: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="font-heading text-[1.95rem] leading-none font-semibold tracking-[-0.04em] text-foreground sm:text-[2.15rem]">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        {actions}
        <Badge
          variant="outline"
          className="h-8 rounded-full border-border bg-foreground/[0.03] px-3.5 text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase"
        >
          Last assessed {formatTimestamp(lastAssessed)}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onRefresh}
          className="h-10 rounded-full border-border bg-foreground/[0.03] px-4 text-[0.77rem] tracking-[0.16em] text-foreground uppercase hover:bg-foreground/[0.06]"
        >
          <RefreshCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} />
          Refresh
        </Button>
      </div>
    </div>
  );
}

function FriendChip({
  friend,
  onSelect,
  index,
}: {
  friend: FriendRiskSummary;
  onSelect: (friend: FriendRiskSummary) => void;
  index: number;
}) {
  const color = getRiskColor(friend.score);

  return (
    <button
      type="button"
      onClick={() => onSelect(friend)}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:ease-out group w-[8.75rem] text-left transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01]"
      style={{
        animationDelay: `${120 + index * 55}ms`,
        animationFillMode: "both",
      }}
    >
      <div
        className="flex aspect-square items-center justify-center rounded-full border-[4px] bg-foreground/[0.05] transition-all duration-300 ease-out group-hover:opacity-88"
        style={{ borderColor: color }}
      >
        <Avatar className="size-[6.9rem] rounded-full bg-foreground/[0.06] ring-1 ring-border">
          <AvatarImage src={friend.avatarUrl} alt={friend.displayName} />
          <AvatarFallback>{friend.displayName.slice(0, 1)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="truncate text-[1rem] font-semibold text-foreground">
          {friend.displayName}
        </p>
        <p className="truncate text-[0.92rem] text-muted-foreground">@{friend.name}</p>
        <p className="text-[0.92rem] font-medium" style={{ color }}>
          Suspicion: {friend.score}%
        </p>
      </div>
    </button>
  );
}

function GameCard({
  game,
  onSelect,
  index,
}: {
  game: GameRiskSummary;
  onSelect: (game: GameRiskSummary) => void;
  index: number;
}) {
  const color = getRiskColor(game.score);

  return (
    <button
      type="button"
      onClick={() => onSelect(game)}
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 motion-safe:ease-out w-full max-w-[15.25rem] text-left transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01]"
      style={{
        animationDelay: `${180 + index * 70}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="space-y-4">
        <div
          className="aspect-square overflow-hidden rounded-[1.2rem] border-[4px] bg-foreground/[0.04] transition-transform duration-300 ease-out"
          style={{ borderColor: color }}
        >
          <Image
            src={game.thumbnailUrl}
            alt={game.name}
            width={560}
            height={560}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="space-y-1.5 px-1">
          <p className="line-clamp-1 text-[1.02rem] font-semibold text-foreground">
            {game.name}
          </p>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            Created by{" "}
            <span className="font-medium text-foreground/80">{game.creatorName}</span>
          </p>
          <p className="text-sm font-medium" style={{ color }}>
            Suspicion: {game.score}%
          </p>
        </div>
      </div>
    </button>
  );
}

function NotesBlock({ summary, notes }: { summary: string; notes: string[] }) {
  return (
    <div
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:ease-out mt-6 max-w-[40rem] space-y-4"
      style={{ animationDelay: "220ms", animationFillMode: "both" }}
    >
      <p className="text-sm leading-7 text-muted-foreground">{summary}</p>
      <div className="grid gap-2.5">
        {notes.map((note) => (
          <div
            key={note}
            className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
          >
            <ShieldAlert className="mt-1 size-4 shrink-0 text-muted-foreground/70" />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AssessmentShell({
  initialAssessment,
  authConfigured,
  gemmaWideWebConfigured,
  isLoggedIn,
}: AssessmentShellProps) {
  const { wideWebSearchEnabled } = usePreferences();
  const [assessment, setAssessment] = useState(initialAssessment);
  const [refreshScope, setRefreshScope] = useState<RefreshScope | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReportPreviewLoading, setIsReportPreviewLoading] = useState(false);
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [dialogSelection, setDialogSelection] = useState<DialogSelection>(null);
  const [loadingGameDetailId, setLoadingGameDetailId] = useState<number | null>(null);
  const [wideWebLiveSearchStage, setWideWebLiveSearchStage] =
    useState<WideWebLiveSearchStage>(null);
  const [showAllFriends, setShowAllFriends] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);
  const [, startTransition] = useTransition();
  const hasAdditionalScoredFriends =
    assessment.scoredFriends.length > assessment.highRiskFriends.length;
  const visibleFriends = showAllFriends
    ? assessment.scoredFriends
    : assessment.highRiskFriends;
  const hasAdditionalScoredGames =
    assessment.scoredGames.length > assessment.highRiskGames.length;
  const visibleGames = showAllGames
    ? assessment.scoredGames
    : assessment.highRiskGames;

  async function refreshGameDetail(
    game: GameRiskSummary,
    wideWebSearchMode: WideWebSearchMode,
  ) {
    setDialogSelection({ kind: "game", item: game });

    if (loadingGameDetailId === game.placeId) {
      return;
    }

    setLoadingGameDetailId(game.placeId);
    setWideWebLiveSearchStage(null);

    try {
      const response = await fetch(`/api/assessments/games/${game.placeId}/refresh`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          streamProgress: true,
          wideWebSearchMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not load expanded game detail.");
      }

      let payload: { game: GameRiskSummary } | null = null;

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) {
              continue;
            }

            const event = JSON.parse(line) as
              | { error: string }
              | { game: GameRiskSummary }
              | { stage: "tavily" | "gemma" };

            if ("stage" in event) {
              setWideWebLiveSearchStage(event.stage);
              continue;
            }

            if ("error" in event) {
              throw new Error(event.error);
            }

            if ("game" in event) {
              payload = { game: event.game };
            }
          }
        }

        if (buffer.trim()) {
          const event = JSON.parse(buffer) as
            | { error: string }
            | { game: GameRiskSummary }
            | { stage: "tavily" | "gemma" };

          if ("stage" in event) {
            setWideWebLiveSearchStage(event.stage);
          } else if ("error" in event) {
            throw new Error(event.error);
          } else {
            payload = { game: event.game };
          }
        }
      } else {
        payload = (await response.json()) as { game: GameRiskSummary };
      }

      if (!payload) {
        throw new Error("Could not load expanded game detail.");
      }

      startTransition(() => {
        setDialogSelection((current) =>
          current?.kind === "game" && current.item.placeId === payload.game.placeId
            ? { kind: "game", item: payload.game }
            : current,
        );
        setAssessment((current) => {
          const nextScoredGames = current.scoredGames
            .map((entry) =>
              entry.placeId === payload.game.placeId ? payload.game : entry,
            )
            .sort((left, right) => right.score - left.score);

          return {
            ...current,
            scoredGames: nextScoredGames,
            highRiskGames: nextScoredGames
              .filter((entry) => entry.score >= surfacedRiskThreshold)
              .slice(0, surfacedGameLimit),
            gamesLastAssessed: payload.game.lastAssessed,
          };
        });
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Game detail refresh failed unexpectedly.",
      );
    } finally {
      setLoadingGameDetailId(null);
      setWideWebLiveSearchStage(null);
    }
  }

  async function refreshAssessment(scope: RefreshScope) {
    setRefreshScope(scope);

    try {
      const response = await fetch(
        `/api/assessments/users/${encodeURIComponent(assessment.profile.name)}/refresh`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ scope }),
        },
      );

      if (!response.ok) {
        throw new Error("Assessment refresh failed.");
      }

      const payload = (await response.json()) as { assessment: UserAssessment };

      startTransition(() => {
        setAssessment(payload.assessment);
      });

      toast.success(
        scope === "profile"
          ? "Profile snapshot refreshed."
          : scope === "friends"
            ? "Friend analysis refreshed."
            : "Game analysis refreshed.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Refresh failed unexpectedly.",
      );
    } finally {
      setRefreshScope(null);
    }
  }

  async function saveChild() {
    if (!isLoggedIn) {
      toast.message(
        authConfigured
          ? "Log in first, then save this child to your dashboard."
          : "Sign-in is unavailable right now.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/assessments/users/${encodeURIComponent(assessment.profile.name)}/save-child`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(
          payload?.error ?? "Could not stage this child for the dashboard.",
        );
      }

      const payload = (await response.json()) as {
        child: SavedChildProfile;
        storage: "local" | "supabase";
      };

      if (payload.storage === "local") {
        upsertSavedChild(payload.child);
        toast.success("Saved on this device.");
      } else {
        toast.success("Saved to your dashboard.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Save failed unexpectedly.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const reportPreviewBaseUrl = `/api/reports/users/${encodeURIComponent(
    assessment.profile.name,
  )}/pdf`;
  const reportPreviewUrl = `${reportPreviewBaseUrl}?v=${encodeURIComponent(
    assessment.lastAssessed,
  )}`;
  const reportDownloadUrl = `${reportPreviewBaseUrl}?download=1`;

  function openReportPreview() {
    setIsReportPreviewLoading(true);
    setIsReportPreviewOpen(true);
  }

  async function openGameDetail(game: GameRiskSummary) {
    await refreshGameDetail(
      game,
      wideWebSearchEnabled ? "prefer-cache" : "cache-only",
    );
  }

  return (
    <>
      <div className="shell flex flex-1 flex-col pb-20 pt-10 sm:pt-12">
        <div className="mx-auto flex w-full max-w-[68rem] flex-col gap-[4.5rem]">
          <section className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
            <a
              href={assessment.profile.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-700 motion-safe:ease-out mx-auto flex size-[13.5rem] items-center justify-center rounded-full bg-foreground/[0.05] ring-1 ring-border transition-all duration-300 ease-out hover:scale-[1.01] hover:opacity-86 lg:mx-0 lg:size-[14.5rem]"
              style={{ animationDelay: "40ms", animationFillMode: "both" }}
            >
              <Avatar className="size-[12rem] rounded-full bg-foreground/[0.08] ring-1 ring-border lg:size-[13rem]">
                <AvatarImage
                  src={assessment.profile.avatarUrl}
                  alt={assessment.profile.displayName}
                />
                <AvatarFallback>
                  {assessment.profile.displayName.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            </a>

            <div
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-700 motion-safe:ease-out flex max-w-[44rem] flex-col"
              style={{ animationDelay: "110ms", animationFillMode: "both" }}
            >
              <a
                href={assessment.profile.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-col self-start transition-opacity duration-300 ease-out hover:opacity-80"
              >
                <span className="font-heading text-[2.45rem] leading-[0.96] font-semibold tracking-[-0.05em] text-foreground sm:text-[2.9rem] lg:text-[3.35rem]">
                  {assessment.profile.displayName}
                </span>
                <span className="mt-2 inline-flex items-center gap-2 text-[1.75rem] leading-none text-muted-foreground sm:text-[2rem] lg:text-[2.3rem]">
                  @{assessment.profile.name}
                  <ExternalLink className="size-5 lg:size-6" />
                </span>
              </a>

              <div
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:ease-out mt-6 flex flex-wrap items-center gap-3 rounded-[1.2rem] border border-border bg-muted/90 p-3"
                style={{ animationDelay: "180ms", animationFillMode: "both" }}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => refreshAssessment("profile")}
                  className="h-11 rounded-full border-border bg-background/70 px-5 text-[0.96rem] text-foreground transition-all duration-300 ease-out hover:bg-accent hover:scale-[1.01]"
                >
                  <RefreshCw
                    className={
                      refreshScope === "profile"
                        ? "size-4 animate-spin"
                        : "size-4"
                    }
                  />
                  Refresh
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={saveChild}
                  disabled={isSaving}
                  className="h-11 rounded-full bg-primary px-5 text-[0.96rem] text-primary-foreground transition-all duration-300 ease-out hover:bg-primary/92 hover:scale-[1.01]"
                >
                  <UserRoundPlus className="size-4" />
                  {isSaving ? "Saving" : "Save as Child"}
                </Button>
              </div>

              <div
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-700 motion-safe:ease-out mt-5 flex flex-wrap gap-2.5"
                style={{ animationDelay: "230ms", animationFillMode: "both" }}
              >
                <Badge
                  variant="outline"
                  className="h-8 rounded-full border-border bg-foreground/[0.03] px-3.5 text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase"
                >
                  Last assessed {formatTimestamp(assessment.lastAssessed)}
                </Badge>
                <Badge
                  variant="outline"
                  className="h-8 rounded-full border-border bg-foreground/[0.03] px-3.5 text-[0.68rem] tracking-[0.18em] text-muted-foreground uppercase"
                >
                  {assessment.profile.accountAgeDays} day account
                </Badge>
                <Badge
                  variant="outline"
                  className="h-8 rounded-full border-border bg-foreground/[0.03] px-3.5 text-[0.68rem] tracking-[0.18em] uppercase"
                  style={{
                    color: getRiskColor(assessment.overallRiskScore),
                  }}
                >
                  {assessment.overallRiskScore}%{" "}
                  {getRiskLabel(assessment.overallRiskLevel)}
                </Badge>
              </div>

              <NotesBlock
                summary={assessment.summary}
                notes={assessment.notes}
              />
            </div>
          </section>

          <section
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:ease-out space-y-7"
            style={{ animationDelay: "320ms", animationFillMode: "both" }}
          >
            <SectionHeader
              title="Flagged Friends"
              lastAssessed={assessment.friendsLastAssessed}
              refreshing={refreshScope === "friends"}
              onRefresh={() => refreshAssessment("friends")}
              actions={
                hasAdditionalScoredFriends ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowAllFriends((current) => !current)}
                    className="h-10 rounded-full border-border bg-foreground/[0.03] px-4 text-[0.77rem] tracking-[0.12em] text-foreground uppercase hover:bg-foreground/[0.06]"
                  >
                    {showAllFriends
                      ? `Show flagged only (${assessment.highRiskFriends.length})`
                      : `Show all scored friends (${assessment.scoredFriends.length})`}
                  </Button>
                ) : undefined
              }
            />
            {showAllFriends && assessment.scoredFriends.length ? (
              <p className="text-sm text-muted-foreground">
                Showing every scored public friend, including profiles below the{" "}
                {surfacedRiskThreshold}% review threshold.
              </p>
            ) : null}
            {visibleFriends.length ? (
              <div className="flex flex-wrap gap-x-10 gap-y-8">
                {visibleFriends.map((friend, index) => (
                  <FriendChip
                    key={friend.id}
                    friend={friend}
                    index={index}
                    onSelect={(nextFriend) =>
                      setDialogSelection({ kind: "friend", item: nextFriend })
                    }
                  />
                ))}
              </div>
            ) : assessment.scoredFriends.length ? (
              <p className="text-sm text-muted-foreground">
                No public friends crossed the {surfacedRiskThreshold}% review
                threshold. Use Show all scored friends to inspect the
                lower-score profiles.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No public friends were available to score.
              </p>
            )}
          </section>

          <section
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:ease-out space-y-7"
            style={{ animationDelay: "430ms", animationFillMode: "both" }}
          >
            <SectionHeader
              title="Flagged Games"
              lastAssessed={assessment.gamesLastAssessed}
              refreshing={refreshScope === "games"}
              onRefresh={() => refreshAssessment("games")}
              actions={
                hasAdditionalScoredGames ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowAllGames((current) => !current)}
                    className="h-10 rounded-full border-border bg-foreground/[0.03] px-4 text-[0.77rem] tracking-[0.12em] text-foreground uppercase hover:bg-foreground/[0.06]"
                  >
                    {showAllGames
                      ? `Show flagged only (${assessment.highRiskGames.length})`
                      : `Show all scored games (${assessment.scoredGames.length})`}
                  </Button>
                ) : undefined
              }
            />
            {showAllGames && assessment.scoredGames.length ? (
              <p className="text-sm text-muted-foreground">
                Showing every scored public favorite or created game, including
                titles below the {surfacedRiskThreshold}% review threshold.
              </p>
            ) : null}
            {visibleGames.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-6">
                {visibleGames.map((game, index) => (
                  <GameCard
                    key={game.placeId}
                    game={game}
                    index={index}
                    onSelect={(nextGame) => {
                      void openGameDetail(nextGame);
                    }}
                  />
                ))}
              </div>
            ) : assessment.scoredGames.length ? (
              <p className="text-sm text-muted-foreground">
                No public favorite or created games crossed the{" "}
                {surfacedRiskThreshold}% review threshold. Use Show all scored
                games to inspect the lower-score matches.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No public favorite or created games were available to score.
              </p>
            )}
          </section>

          <div
            className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-3 motion-safe:duration-700 motion-safe:ease-out flex justify-center pt-6"
            style={{ animationDelay: "560ms", animationFillMode: "both" }}
          >
            <Button
              type="button"
              size="lg"
              onClick={openReportPreview}
              className="h-12 min-w-[18rem] rounded-[1rem] bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out hover:scale-[1.01] hover:bg-primary/92"
            >
              <FileText className="size-4" />
              Preview PDF Report
            </Button>
          </div>
        </div>
      </div>

      <ReportPreviewDialog
        downloadUrl={reportDownloadUrl}
        open={isReportPreviewOpen}
        onOpenChange={(open) => {
          setIsReportPreviewOpen(open);
          if (!open) {
            setIsReportPreviewLoading(false);
          }
        }}
        onPreviewLoaded={() => {
          setIsReportPreviewLoading(false);
        }}
        previewLoading={isReportPreviewLoading}
        previewUrl={reportPreviewUrl}
        username={assessment.profile.name}
      />

      <RiskDetailDialog
        entity={dialogSelection}
        open={Boolean(dialogSelection)}
        gemmaWideWebConfigured={gemmaWideWebConfigured}
        onRefreshWideWeb={
          dialogSelection?.kind === "game"
            ? () => {
                void refreshGameDetail(dialogSelection.item, "force-refresh");
              }
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            setDialogSelection(null);
          }
        }}
        wideWebLiveSearchStage={
          dialogSelection?.kind === "game" &&
          loadingGameDetailId === dialogSelection.item.placeId
            ? wideWebLiveSearchStage
            : null
        }
        wideWebRefreshPending={
          dialogSelection?.kind === "game" &&
          loadingGameDetailId === dialogSelection.item.placeId
        }
      />
    </>
  );
}
