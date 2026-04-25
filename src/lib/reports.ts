import { formatCompactNumber, formatTimestamp } from "@/lib/format";
import { getRiskLabel } from "@/lib/risk";
import type { GameRiskSummary, UserAssessment } from "@/lib/types";

function renderGameStats(game: GameRiskSummary) {
  return [
    `Genres: ${game.genres.length ? game.genres.join(", ") : "n/a"}`,
    `Rating: ${game.rating == null ? "n/a" : `${game.rating.toFixed(1)} / 100`}`,
    `Votes: ${formatCompactNumber(game.ratingCount)}`,
    `Private servers enabled: ${game.privateServersEnabled ? "yes" : "no"}`,
  ].join("\n");
}

export function buildPhase0ReportText(assessment: UserAssessment) {
  const lines = [
    "RoRadar Safety Snapshot",
    "=======================",
    "",
    `Profile: ${assessment.profile.displayName} (@${assessment.profile.name})`,
    `Roblox user id: ${assessment.profile.id}`,
    `Assessed: ${formatTimestamp(assessment.lastAssessed)}`,
    `Overall preview score: ${assessment.overallRiskScore}% (${getRiskLabel(
      assessment.overallRiskLevel,
    )})`,
    "",
    assessment.summary,
    "",
    "Notes",
    "-----",
    ...assessment.notes.map((note) => `- ${note}`),
    "",
    "High-Risk Friends",
    "-----------------",
  ];

  if (!assessment.highRiskFriends.length) {
    lines.push("No high-risk friends crossed the Phase 0 preview threshold.");
  } else {
    assessment.highRiskFriends.forEach((friend) => {
      lines.push(
        `${friend.displayName} (@${friend.name}) - ${friend.score}% (${getRiskLabel(
          friend.level,
        )})`,
      );
      friend.factors.forEach((factor) => {
        lines.push(
          `  • ${factor.label}: ${String(factor.value)}${factor.active ? "" : " (inactive)"}`,
        );
      });
      lines.push(`  • Roblox profile: ${friend.profileUrl}`);
      lines.push("");
    });
  }

  lines.push("High-Risk Games");
  lines.push("---------------");

  assessment.highRiskGames.forEach((game) => {
    lines.push(
      `${game.name} - ${game.score}% (${getRiskLabel(game.level)})`,
      `  • Creator: ${game.creatorName}`,
      `  • Link: ${game.robloxUrl}`,
      ...renderGameStats(game)
        .split("\n")
        .map((line) => `  • ${line}`),
    );
    game.factors.forEach((factor) => {
      lines.push(
        `  • ${factor.label}: ${String(factor.value)}${factor.active ? "" : " (inactive)"}`,
      );
    });
    lines.push("");
  });

  lines.push(
    "Phase 0 disclosure: this report blends live Roblox profile data with seeded demo scoring and does not yet include external community-source searches.",
  );

  return lines.join("\n");
}
