import type { RiskLevel } from "@/lib/types";

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) {
    return "high";
  }

  if (score >= 63) {
    return "elevated";
  }

  if (score >= 36) {
    return "guarded";
  }

  return "low";
}

export function getRiskLabel(level: RiskLevel) {
  switch (level) {
    case "high":
      return "High risk";
    case "elevated":
      return "Needs review";
    case "guarded":
      return "Watch list";
    case "low":
      return "Low concern";
  }
}

export function getRiskColor(score: number) {
  if (score >= 80) {
    return "#ef6b73";
  }

  if (score >= 63) {
    return "#f3b55d";
  }

  if (score >= 36) {
    return "#d6cf8b";
  }

  return "#79d792";
}

export function getRiskTint(score: number) {
  if (score >= 80) {
    return "rgba(239, 107, 115, 0.14)";
  }

  if (score >= 63) {
    return "rgba(243, 181, 93, 0.14)";
  }

  if (score >= 36) {
    return "rgba(214, 207, 139, 0.12)";
  }

  return "rgba(121, 215, 146, 0.12)";
}
