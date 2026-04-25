"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import {
  Download,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  UserRoundPlus,
} from "lucide-react";
import { toast } from "sonner";

import { RiskDetailDialog } from "@/components/assessment/risk-detail-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCompactNumber, formatTimestamp } from "@/lib/format";
import { getRiskColor, getRiskLabel, getRiskTint } from "@/lib/risk";
import { upsertSavedChild } from "@/lib/saved-children";
import type { FriendRiskSummary, GameRiskSummary, UserAssessment } from "@/lib/types";

type AssessmentShellProps = {
  initialAssessment: UserAssessment;
  authConfigured: boolean;
  isLoggedIn: boolean;
};

type RefreshScope = "profile" | "friends" | "games";
type DialogSelection =
  | { kind: "friend"; item: FriendRiskSummary }
  | { kind: "game"; item: GameRiskSummary }
  | null;

function SectionHeader({
  title,
  subtitle,
  lastAssessed,
  refreshing,
  onRefresh,
}: {
  title: string;
  subtitle: string;
  lastAssessed: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="font-heading text-2xl text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-white/58">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 self-start">
        <span className="text-xs tracking-[0.22em] text-white/42 uppercase">
          Last assessed {formatTimestamp(lastAssessed)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.06]"
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
}: {
  friend: FriendRiskSummary;
  onSelect: (friend: FriendRiskSummary) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(friend)}
      className="flex w-full items-center gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition hover:opacity-72"
      style={{
        borderColor: `${getRiskColor(friend.score)}88`,
        boxShadow: `inset 0 0 0 1px ${getRiskTint(friend.score)}`,
      }}
    >
      <Avatar
        size="lg"
        className="size-14 border"
        style={{ borderColor: getRiskColor(friend.score) }}
      >
        <AvatarImage src={friend.avatarUrl} alt={friend.displayName} />
        <AvatarFallback>{friend.displayName.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{friend.displayName}</p>
        <p className="truncate text-sm text-white/52">@{friend.name}</p>
      </div>
      <div className="text-right">
        <p
          className="text-sm font-semibold"
          style={{ color: getRiskColor(friend.score) }}
        >
          {friend.score}%
        </p>
        <p className="text-xs text-white/42">{getRiskLabel(friend.level)}</p>
      </div>
    </button>
  );
}

function GameCard({
  game,
  onSelect,
}: {
  game: GameRiskSummary;
  onSelect: (game: GameRiskSummary) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(game)}
      className="overflow-hidden rounded-[1.5rem] border bg-white/[0.03] text-left transition hover:opacity-72"
      style={{
        borderColor: `${getRiskColor(game.score)}88`,
        boxShadow: `inset 0 0 0 1px ${getRiskTint(game.score)}`,
      }}
    >
      <div className="aspect-square overflow-hidden bg-black/20">
        <Image
          src={game.thumbnailUrl}
          alt={game.name}
          width={560}
          height={560}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-white">{game.name}</p>
            <p className="text-sm text-white/52">{game.creatorName}</p>
          </div>
          <div
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{
              background: getRiskTint(game.score),
              color: getRiskColor(game.score),
            }}
          >
            {game.score}%
          </div>
        </div>
      </div>
    </button>
  );
}

export function AssessmentShell({
  initialAssessment,
  authConfigured,
  isLoggedIn,
}: AssessmentShellProps) {
  const [assessment, setAssessment] = useState(initialAssessment);
  const [refreshScope, setRefreshScope] = useState<RefreshScope | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogSelection, setDialogSelection] = useState<DialogSelection>(null);
  const [, startTransition] = useTransition();

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
            ? "Friend preview refreshed."
            : "Game preview refreshed.",
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
          : "Add Auth0 env vars to activate saved-child login flows.",
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
        throw new Error("Could not stage this child for the dashboard.");
      }

      const payload = (await response.json()) as {
        child: {
          id: number;
          name: string;
          displayName: string;
          avatarUrl: string;
          profileUrl: string;
          savedAt: string;
        };
      };

      upsertSavedChild(payload.child);
      toast.success("Saved to the Phase 0 dashboard.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Save failed unexpectedly.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function downloadReport() {
    window.location.href = `/api/reports/users/${encodeURIComponent(
      assessment.profile.name,
    )}`;
  }

  return (
    <>
      <div className="shell flex flex-1 flex-col gap-6 py-8 sm:py-10">
        <Card className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#141518] py-0">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <Badge
                variant="outline"
                className="border-white/10 bg-white/[0.03] text-white/62"
              >
                Phase 0 preview
              </Badge>
              <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
                <a
                  href={assessment.profile.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 transition hover:opacity-75"
                >
                  <Avatar size="lg" className="size-[4.5rem] rounded-[1.6rem]">
                    <AvatarImage
                      src={assessment.profile.avatarUrl}
                      alt={assessment.profile.displayName}
                    />
                    <AvatarFallback>
                      {assessment.profile.displayName.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-heading text-4xl text-white">
                      {assessment.profile.displayName}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-base text-white/56">
                      @{assessment.profile.name}
                      <ExternalLink className="size-4" />
                    </p>
                  </div>
                </a>

                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => refreshAssessment("profile")}
                    className="border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.06]"
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
                    onClick={saveChild}
                    disabled={isSaving}
                    className="bg-white text-black hover:bg-white/85"
                  >
                    <UserRoundPlus className="size-4" />
                    {isSaving ? "Saving" : "Save as Child"}
                  </Button>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-7 text-white/62">
                {assessment.summary}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs tracking-[0.22em] text-white/42 uppercase">
                    Last assessed
                  </p>
                  <p className="mt-2 text-sm text-white/76">
                    {formatTimestamp(assessment.lastAssessed)}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs tracking-[0.22em] text-white/42 uppercase">
                    Friend count
                  </p>
                  <p className="mt-2 text-sm text-white/76">
                    {formatCompactNumber(assessment.profile.friendCount)}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs tracking-[0.22em] text-white/42 uppercase">
                    Account age
                  </p>
                  <p className="mt-2 text-sm text-white/76">
                    {assessment.profile.accountAgeDays} days
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.22em] text-white/42 uppercase">
                    Overall preview signal
                  </p>
                  <p className="mt-2 font-heading text-4xl text-white">
                    {assessment.overallRiskScore}%
                  </p>
                </div>
                <div
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: `${getRiskColor(assessment.overallRiskScore)}88`,
                    color: getRiskColor(assessment.overallRiskScore),
                    background: getRiskTint(assessment.overallRiskScore),
                  }}
                >
                  {getRiskLabel(assessment.overallRiskLevel)}
                </div>
              </div>
              <div className="mt-5 h-2 rounded-full bg-white/8">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${assessment.overallRiskScore}%`,
                    background: getRiskColor(assessment.overallRiskScore),
                  }}
                />
              </div>
              <Separator className="my-5 bg-white/8" />
              <div className="space-y-3">
                {assessment.notes.map((note) => (
                  <div
                    key={note}
                    className="flex gap-3 rounded-[1rem] border border-white/8 bg-black/10 px-3 py-3 text-sm leading-6 text-white/66"
                  >
                    <ShieldAlert className="mt-1 size-4 shrink-0 text-white/42" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border border-white/10 bg-[#141518]">
          <CardHeader className="px-6 pt-6">
            <SectionHeader
              title="High-Risk Friends"
              subtitle="Live friends list, Phase 0 preview weighting, and clickable score breakdowns."
              lastAssessed={assessment.friendsLastAssessed}
              refreshing={refreshScope === "friends"}
              onRefresh={() => refreshAssessment("friends")}
            />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {assessment.highRiskFriends.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {assessment.highRiskFriends.map((friend) => (
                  <FriendChip
                    key={friend.id}
                    friend={friend}
                    onSelect={(nextFriend) =>
                      setDialogSelection({ kind: "friend", item: nextFriend })
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.4rem] border border-emerald-400/25 bg-emerald-400/7 px-5 py-5 text-sm text-emerald-200">
                This user seems to choose their friends well.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-white/10 bg-[#141518]">
          <CardHeader className="px-6 pt-6">
            <SectionHeader
              title="High-Risk Games"
              subtitle="Seeded live game cards for Phase 0. Full game scoring and external signal confirmation arrive in later phases."
              lastAssessed={assessment.gamesLastAssessed}
              refreshing={refreshScope === "games"}
              onRefresh={() => refreshAssessment("games")}
            />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {assessment.highRiskGames.map((game) => (
                <GameCard
                  key={game.placeId}
                  game={game}
                  onSelect={(nextGame) =>
                    setDialogSelection({ kind: "game", item: nextGame })
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="pb-8">
          <Button
            type="button"
            size="lg"
            onClick={downloadReport}
            className="h-12 rounded-[1.25rem] bg-white text-black hover:bg-white/85"
          >
            <Download className="size-4" />
            Download Report
          </Button>
        </div>
      </div>

      <RiskDetailDialog
        entity={dialogSelection}
        open={Boolean(dialogSelection)}
        onOpenChange={(open) => {
          if (!open) {
            setDialogSelection(null);
          }
        }}
      />
    </>
  );
}
