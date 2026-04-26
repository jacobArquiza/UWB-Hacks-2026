import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import { formatCompactNumber, formatTimestamp } from "@/lib/format";
import { getRiskLabel } from "@/lib/risk";
import { surfacedRiskThreshold } from "@/lib/assessment-thresholds";
import type { GameRiskSummary, UserAssessment } from "@/lib/types";

const reportPageWidth = 612;
const reportPageHeight = 792;
const reportPageMargin = 48;

type PdfLineStyle = {
  color: ReturnType<typeof rgb>;
  font: PDFFont;
  gapAfter: number;
  gapBefore: number;
  indent: number;
  lineHeight: number;
  size: number;
};

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
    "Flagged Friends",
    "---------------",
  ];

  if (!assessment.highRiskFriends.length) {
    lines.push(
      `No public friends crossed the ${surfacedRiskThreshold}% review threshold.`,
    );
    if (assessment.scoredFriends.length) {
      lines.push(
        `The app still scored ${assessment.scoredFriends.length} public friend profile(s) below that threshold.`,
      );
      lines.push(
        "Lower-scoring public friend profiles are available in the app under Show all scored friends.",
      );
    }
  } else {
    assessment.highRiskFriends.forEach((friend) => {
      lines.push(
        `${friend.displayName} (@${friend.name}) - ${friend.score}% (${getRiskLabel(
          friend.level,
        )})`,
      );
      friend.factors.forEach((factor) => {
        lines.push(
          `  • ${factor.label}: ${String(factor.value)}${factor.active ? "" : " (inactive)"} [${factor.contribution} pts]`,
        );
        factor.observedSignals?.forEach((signal) => {
          lines.push(`    - ${signal}`);
        });
        factor.observedSources?.forEach((source) => {
          lines.push(`    - Source: ${source.label} -> ${source.url}`);
        });
      });
      lines.push(`  • Roblox profile: ${friend.profileUrl}`);
      lines.push("");
    });
  }

  lines.push("Flagged Games");
  lines.push("-------------");

  if (!assessment.highRiskGames.length) {
    lines.push(
      `No public favorite or created games crossed the ${surfacedRiskThreshold}% review threshold.`,
    );
    if (assessment.scoredGames.length) {
      lines.push(
        `The app still scored ${assessment.scoredGames.length} public game association(s) below that threshold.`,
      );
    }
  } else {
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
          `  • ${factor.label}: ${String(factor.value)}${factor.active ? "" : " (inactive)"} [${factor.contribution} pts]`,
        );
        factor.observedSignals?.forEach((signal) => {
          lines.push(`    - ${signal}`);
        });
        factor.observedSources?.forEach((source) => {
          lines.push(`    - Source: ${source.label} -> ${source.url}`);
        });
      });
      lines.push("");
    });

    if (assessment.scoredGames.length > assessment.highRiskGames.length) {
      lines.push(
        "Lower-scoring public game associations are available in the app under Show all scored games.",
      );
      lines.push("");
    }
  }

  lines.push(
    "Phase 0 disclosure: this report blends live Roblox profile data, public Roblox game associations, preview scoring, and lightweight Reddit / DevForum corroboration. Private recent-play history and YouTube checks are still out of scope.",
  );

  return lines.join("\n");
}

function chunkPdfWord(word: string, font: PDFFont, size: number, maxWidth: number) {
  const chunks: string[] = [];
  let current = "";

  for (const character of word) {
    const next = `${current}${character}`;

    if (font.widthOfTextAtSize(next, size) <= maxWidth || !current) {
      current = next;
      continue;
    }

    chunks.push(current);
    current = character;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function wrapPdfText(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (!text.trim()) {
    return [""];
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = "";
    }

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
      continue;
    }

    const chunks = chunkPdfWord(word, font, size, maxWidth);

    if (chunks.length > 1) {
      lines.push(...chunks.slice(0, -1));
      current = chunks[chunks.length - 1];
    } else {
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function getPdfLineStyle(
  line: string,
  fonts: {
    body: PDFFont;
    bold: PDFFont;
  },
): PdfLineStyle {
  if (line === "RoRadar Safety Snapshot") {
    return {
      color: rgb(0.19, 0.36, 0.96),
      font: fonts.bold,
      gapAfter: 12,
      gapBefore: 0,
      indent: 0,
      lineHeight: 28,
      size: 22,
    };
  }

  if (["Notes", "Flagged Friends", "Flagged Games"].includes(line)) {
    return {
      color: rgb(0.1, 0.13, 0.18),
      font: fonts.bold,
      gapAfter: 6,
      gapBefore: 12,
      indent: 0,
      lineHeight: 20,
      size: 15,
    };
  }

  if (line.startsWith("    - ")) {
    return {
      color: rgb(0.34, 0.38, 0.45),
      font: fonts.body,
      gapAfter: 1,
      gapBefore: 0,
      indent: 28,
      lineHeight: 13,
      size: 9.5,
    };
  }

  if (line.startsWith("  • ")) {
    return {
      color: rgb(0.19, 0.24, 0.31),
      font: fonts.body,
      gapAfter: 2,
      gapBefore: 0,
      indent: 18,
      lineHeight: 14,
      size: 10,
    };
  }

  if (line.startsWith("- ")) {
    return {
      color: rgb(0.27, 0.31, 0.38),
      font: fonts.body,
      gapAfter: 2,
      gapBefore: 0,
      indent: 10,
      lineHeight: 14,
      size: 10.5,
    };
  }

  return {
    color: rgb(0.2, 0.24, 0.3),
    font: fonts.body,
    gapAfter: 3,
    gapBefore: 0,
    indent: 0,
    lineHeight: 15,
    size: 10.5,
  };
}

function drawPdfHeader(page: PDFPage, fonts: { body: PDFFont; bold: PDFFont }) {
  page.drawRectangle({
    color: rgb(0.19, 0.36, 0.96),
    height: 4,
    width: reportPageWidth - reportPageMargin * 2,
    x: reportPageMargin,
    y: reportPageHeight - reportPageMargin + 10,
  });
  page.drawText("RoRadar Parent Report", {
    color: rgb(0.4, 0.45, 0.54),
    font: fonts.bold,
    size: 9,
    x: reportPageMargin,
    y: reportPageHeight - reportPageMargin + 20,
  });
}

function drawPdfFooter(
  page: PDFPage,
  pageNumber: number,
  pageCount: number,
  font: PDFFont,
) {
  page.drawText(`Page ${pageNumber} of ${pageCount}`, {
    color: rgb(0.5, 0.54, 0.62),
    font,
    size: 9,
    x: reportPageWidth - reportPageMargin - 56,
    y: 24,
  });
}

export async function buildPhase0ReportPdf(assessment: UserAssessment) {
  const document = await PDFDocument.create();
  const bodyFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const lines = buildPhase0ReportText(assessment)
    .split("\n")
    .filter((line) => !/^=+$/.test(line) && !/^-+$/.test(line));

  const fonts = {
    body: bodyFont,
    bold: boldFont,
  };

  let page = document.addPage([reportPageWidth, reportPageHeight]);
  drawPdfHeader(page, fonts);
  let y = reportPageHeight - reportPageMargin - 8;

  for (const line of lines) {
    if (!line.trim()) {
      y -= 8;
      continue;
    }

    const style = getPdfLineStyle(line, fonts);
    const maxWidth = reportPageWidth - reportPageMargin * 2 - style.indent;
    const wrappedLines = wrapPdfText(line, style.font, style.size, maxWidth);
    const blockHeight =
      style.gapBefore +
      wrappedLines.length * style.lineHeight +
      style.gapAfter;

    if (y - blockHeight < reportPageMargin + 24) {
      page = document.addPage([reportPageWidth, reportPageHeight]);
      drawPdfHeader(page, fonts);
      y = reportPageHeight - reportPageMargin - 8;
    }

    y -= style.gapBefore;

    for (const wrappedLine of wrappedLines) {
      page.drawText(wrappedLine, {
        color: style.color,
        font: style.font,
        size: style.size,
        x: reportPageMargin + style.indent,
        y,
      });
      y -= style.lineHeight;
    }

    y -= style.gapAfter;
  }

  const pages = document.getPages();

  pages.forEach((pdfPage, index) => {
    drawPdfFooter(pdfPage, index + 1, pages.length, bodyFont);
  });

  return await document.save();
}
