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
import type { GameRiskSummary, RiskFactor, UserAssessment } from "@/lib/types";

const reportPageWidth = 612;
const reportPageHeight = 792;
const reportPageMargin = 48;
const reportFooterReserve = 34;
const reportContentTopY = reportPageHeight - reportPageMargin - 8;
const reportColumnGap = 24;
const reportColumnWidth =
  (reportPageWidth - reportPageMargin * 2 - reportColumnGap) / 2;

type PdfLineStyle = {
  color: ReturnType<typeof rgb>;
  font: PDFFont;
  gapAfter: number;
  gapBefore: number;
  indent: number;
  lineHeight: number;
  size: number;
};

const pdfCharacterFallbacks = new Map<string, string>([
  ["\u00A0", " "],
  ["\u2013", "-"],
  ["\u2014", "-"],
  ["\u2018", "'"],
  ["\u2019", "'"],
  ["\u201C", '"'],
  ["\u201D", '"'],
  ["\u2026", "..."],
  ["\u2192", "->"],
  ["\u{1F50A}", " voice chat "],
  ["\u{1F3E1}", " house "],
]);

function canEncodePdfText(font: PDFFont, text: string) {
  try {
    font.encodeText(text);
    return true;
  } catch {
    return false;
  }
}

function sanitizePdfText(text: string, font: PDFFont) {
  let sanitized = "";

  for (const character of text) {
    const mapped = pdfCharacterFallbacks.get(character);

    if (mapped) {
      for (const mappedCharacter of mapped) {
        if (canEncodePdfText(font, mappedCharacter)) {
          sanitized += mappedCharacter;
        }
      }
      continue;
    }

    if (canEncodePdfText(font, character)) {
      sanitized += character;
      continue;
    }

    const asciiFallback = character
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");

    if (asciiFallback && canEncodePdfText(font, asciiFallback)) {
      sanitized += asciiFallback;
    }
  }

  return sanitized;
}

function renderGameStats(game: GameRiskSummary) {
  return [
    `Genres: ${game.genres.length ? game.genres.join(", ") : "n/a"}`,
    `Rating: ${game.rating == null ? "n/a" : `${game.rating.toFixed(1)} / 100`}`,
    `Votes: ${formatCompactNumber(game.ratingCount)}`,
    `Private servers enabled: ${game.privateServersEnabled ? "yes" : "no"}`,
  ].join("\n");
}

function getFactorGuidance(factor: RiskFactor) {
  switch (factor.key) {
    case "account-age":
      return "Why it matters: newer accounts are easier to create and discard. Lower signals usually mean an older, more established profile; higher signals usually mean a very new account.";
    case "profile-language":
      return "Why it matters: names and bios can show contact-seeking or dating-style language. Lower signals usually mean little risky language in the public profile; higher signals usually mean stronger off-platform, disposable, or solicitation-style cues.";
    case "mutual-friend-overlap":
      return "Why it matters: visible overlap helps show whether a friend is embedded in the same public network. Lower signals usually mean stronger mutual overlap; higher signals usually mean little or no visible overlap.";
    case "friend-graph-velocity":
      return "Why it matters: unusual friend growth can be a graph anomaly. Lower signals usually mean slower, more typical growth; higher signals usually mean rapid accumulation, especially on a young or isolated account.";
    case "public-game-source":
      return "Why it matters: this explains how the game entered the review. Lower and higher readings do not change risk here; the row is informational rather than score-driving.";
    case "metadata-language":
      return "Why it matters: public game language can signal how socially intense the experience is. Lower signals usually mean neutral metadata; higher signals usually mean stronger roleplay, dating, voice-chat, or hangout language.";
    case "private-servers":
      return "Why it matters: private spaces can make activity less visible. Lower signals usually mean private servers are not enabled; higher signals usually mean the experience supports more private play spaces.";
    case "community-approval":
      return "Why it matters: weak public approval can be a soft warning sign. Lower signals usually mean stronger approval or missing vote data; higher signals usually mean weaker public approval.";
    case "community-confirmation":
      return "Why it matters: outside discussion can corroborate concerns the game page does not show. Lower signals usually mean little corroborating public discussion; higher signals usually mean stronger safety-relevant discussion tied to the same game.";
    case "wide-web-safety-search":
      return "Why it matters: wider article and forum coverage can reinforce a concern beyond Roblox surfaces. Lower signals usually mean no strong outside corroboration; higher signals usually mean broader sources echoed the same concern.";
    default:
      return null;
  }
}

export function buildReportText(
  assessment: UserAssessment,
  options?: { includeFactorGuidance?: boolean },
) {
  const includeFactorGuidance = options?.includeFactorGuidance ?? false;
  const lines = [
    "RoRadar Safety Snapshot",
    "=======================",
    "",
    `Profile: ${assessment.profile.displayName} (@${assessment.profile.name})`,
    `Roblox user id: ${assessment.profile.id}`,
    `Assessed: ${formatTimestamp(assessment.lastAssessed)}`,
    `Overall risk score: ${assessment.overallRiskScore}% (${getRiskLabel(
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
          `• ${factor.label}: ${String(factor.value)}${factor.active ? "" : " (inactive)"} [${factor.contribution} pts]`,
        );
        const factorGuidance = includeFactorGuidance
          ? getFactorGuidance(factor)
          : null;
        if (factorGuidance) {
          lines.push(`  • ${factorGuidance}`);
        }
        factor.observedSignals?.forEach((signal) => {
          lines.push(`  • ${signal}`);
        });
        factor.observedSources?.forEach((source) => {
          lines.push(`  • Source: ${source.label} -> ${source.url}`);
        });
      });
      lines.push(`• Roblox profile: ${friend.profileUrl}`);
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
        `• Creator: ${game.creatorName}`,
        `• Link: ${game.robloxUrl}`,
        ...renderGameStats(game)
          .split("\n")
          .map((line) => `• ${line}`),
      );
      game.factors.forEach((factor) => {
        lines.push(
          `• ${factor.label}: ${String(factor.value)}${factor.active ? "" : " (inactive)"} [${factor.contribution} pts]`,
        );
        const factorGuidance = includeFactorGuidance
          ? getFactorGuidance(factor)
          : null;
        if (factorGuidance) {
          lines.push(`  • ${factorGuidance}`);
        }
        factor.observedSignals?.forEach((signal) => {
          lines.push(`  • ${signal}`);
        });
        factor.observedSources?.forEach((source) => {
          lines.push(`  • Source: ${source.label} -> ${source.url}`);
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
    "This report blends live Roblox profile data, public friend and game associations, and public corroboration from Reddit, DevForum, and optional wide web analysis when available. Private recent-play history and YouTube discussion are not part of this report.",
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

type PdfPreparedBlock = {
  style: PdfLineStyle;
  wrappedLines: string[];
  blockHeight: number;
};

type PdfLineBlock = {
  lines: string[];
};

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

  if (line.startsWith("  • ")) {
    return {
      color: rgb(0.34, 0.38, 0.45),
      font: fonts.body,
      gapAfter: 0.5,
      gapBefore: 0,
      indent: 14,
      lineHeight: 12,
      size: 9.5,
    };
  }

  if (line.startsWith("• ")) {
    return {
      color: rgb(0.14, 0.18, 0.24),
      font: fonts.bold,
      gapAfter: 1,
      gapBefore: 0,
      indent: 0,
      lineHeight: 13,
      size: 10,
    };
  }

  if (line.startsWith("- ")) {
    return {
      color: rgb(0.27, 0.31, 0.38),
      font: fonts.body,
      gapAfter: 1,
      gapBefore: 0,
      indent: 10,
      lineHeight: 13,
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

function createReportPdfPage(
  document: PDFDocument,
  fonts: { body: PDFFont; bold: PDFFont },
) {
  const page = document.addPage([reportPageWidth, reportPageHeight]);
  drawPdfHeader(page, fonts);
  return page;
}

function preparePdfBlock(
  line: string,
  fonts: {
    body: PDFFont;
    bold: PDFFont;
  },
  maxWidth: number,
) {
  const style = getPdfLineStyle(line, fonts);
  const safeLine = sanitizePdfText(line, style.font);
  const wrappedLines = wrapPdfText(safeLine, style.font, style.size, maxWidth);
  const blockHeight =
    style.gapBefore + wrappedLines.length * style.lineHeight + style.gapAfter;

  return {
    blockHeight,
    style,
    wrappedLines,
  } satisfies PdfPreparedBlock;
}

function drawPdfBlock(
  page: PDFPage,
  y: number,
  x: number,
  preparedBlock: PdfPreparedBlock,
) {
  let nextY = y - preparedBlock.style.gapBefore;

  for (const wrappedLine of preparedBlock.wrappedLines) {
    page.drawText(wrappedLine, {
      color: preparedBlock.style.color,
      font: preparedBlock.style.font,
      size: preparedBlock.style.size,
      x: x + preparedBlock.style.indent,
      y: nextY,
    });
    nextY -= preparedBlock.style.lineHeight;
  }

  return nextY - preparedBlock.style.gapAfter;
}

function renderFullWidthLines(params: {
  document: PDFDocument;
  fonts: {
    body: PDFFont;
    bold: PDFFont;
  };
  lines: string[];
  page: PDFPage;
  y: number;
}) {
  let { page, y } = params;

  for (const line of params.lines) {
    if (!line.trim()) {
      y -= 7;
      continue;
    }

    const preparedBlock = preparePdfBlock(
      line,
      params.fonts,
      reportPageWidth - reportPageMargin * 2,
    );

    if (y - preparedBlock.blockHeight < reportPageMargin + reportFooterReserve) {
      page = createReportPdfPage(params.document, params.fonts);
      y = reportContentTopY;
    }

    y = drawPdfBlock(page, y, reportPageMargin, preparedBlock);
  }

  return { page, y };
}

function splitPdfLineBlocks(lines: string[]) {
  const blocks: PdfLineBlock[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) {
        blocks.push({ lines: current });
        current = [];
      }
      continue;
    }

    current.push(line);
  }

  if (current.length) {
    blocks.push({ lines: current });
  }

  return blocks;
}

function getPdfLineBlockHeight(
  block: PdfLineBlock,
  fonts: {
    body: PDFFont;
    bold: PDFFont;
  },
  maxWidth: number,
) {
  return (
    block.lines.reduce(
      (total, line) => total + preparePdfBlock(line, fonts, maxWidth).blockHeight,
      0,
    ) + 4
  );
}

function renderColumnBlocks(params: {
  document: PDFDocument;
  fonts: {
    body: PDFFont;
    bold: PDFFont;
  };
  blocks: PdfLineBlock[];
  page: PDFPage;
  startY: number;
}) {
  let { page } = params;
  let columnTopY = params.startY;

  if (columnTopY < reportPageMargin + reportFooterReserve + 80) {
    page = createReportPdfPage(params.document, params.fonts);
    columnTopY = reportContentTopY;
  }

  let columnIndex = 0;
  let columnY = columnTopY;

  for (const block of params.blocks) {
    const blockHeight = getPdfLineBlockHeight(
      block,
      params.fonts,
      reportColumnWidth,
    );

    if (columnY - blockHeight < reportPageMargin + reportFooterReserve) {
      if (columnIndex === 0) {
        columnIndex = 1;
        columnY = columnTopY;
      } else {
        page = createReportPdfPage(params.document, params.fonts);
        columnTopY = reportContentTopY;
        columnIndex = 0;
        columnY = columnTopY;
      }
    }

    for (const line of block.lines) {
      const preparedBlock = preparePdfBlock(line, params.fonts, reportColumnWidth);
      columnY = drawPdfBlock(
        page,
        columnY,
        reportPageMargin + columnIndex * (reportColumnWidth + reportColumnGap),
        preparedBlock,
      );
    }

    columnY -= 4;
  }

  return { page };
}

export async function buildReportPdf(assessment: UserAssessment) {
  const document = await PDFDocument.create();
  const bodyFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
  const lines = buildReportText(assessment, { includeFactorGuidance: true })
    .split("\n")
    .filter((line) => !/^=+$/.test(line) && !/^-+$/.test(line));

  const fonts = {
    body: bodyFont,
    bold: boldFont,
  };

  const notesIndex = lines.findIndex((line) => line === "Notes");
  const flaggedFriendsIndex = lines.findIndex((line) => line === "Flagged Friends");
  const flaggedGamesIndex = lines.findIndex((line) => line === "Flagged Games");

  const introLines = notesIndex === -1 ? lines : lines.slice(0, notesIndex);
  const notesLines =
    notesIndex !== -1 && flaggedFriendsIndex !== -1
      ? lines.slice(notesIndex, flaggedFriendsIndex)
      : [];
  const friendLines =
    flaggedFriendsIndex !== -1 && flaggedGamesIndex !== -1
      ? lines.slice(flaggedFriendsIndex, flaggedGamesIndex)
      : [];
  const gameHeaderLines = flaggedGamesIndex !== -1 ? ["Flagged Games"] : [];
  const gameBodyLines =
    flaggedGamesIndex !== -1 ? lines.slice(flaggedGamesIndex + 1) : [];
  const gameBlocks = splitPdfLineBlocks(gameBodyLines);

  let page = createReportPdfPage(document, fonts);
  let y = reportContentTopY;

  ({ page, y } = renderFullWidthLines({
    document,
    fonts,
    lines: introLines,
    page,
    y,
  }));

  ({ page, y } = renderFullWidthLines({
    document,
    fonts,
    lines: notesLines,
    page,
    y,
  }));

  ({ page, y } = renderFullWidthLines({
    document,
    fonts,
    lines: friendLines,
    page,
    y,
  }));

  if (gameBlocks.length) {
    page = createReportPdfPage(document, fonts);
    y = reportContentTopY;
  }

  ({ page, y } = renderFullWidthLines({
    document,
    fonts,
    lines: gameHeaderLines,
    page,
    y,
  }));

  if (gameBlocks.length) {
    ({ page } = renderColumnBlocks({
      document,
      fonts,
      blocks: gameBlocks,
      page,
      startY: y - 6,
    }));
  }

  const pages = document.getPages();

  pages.forEach((pdfPage, index) => {
    drawPdfFooter(pdfPage, index + 1, pages.length, bodyFont);
  });

  return await document.save();
}
