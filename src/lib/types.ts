export type RiskLevel = "low" | "guarded" | "elevated" | "high";
export type WideWebSearchMode =
  | "deferred"
  | "cache-only"
  | "prefer-cache"
  | "force-refresh";

export interface RiskEvidenceLink {
  label: string;
  url: string;
}

export interface RiskFactor {
  key: string;
  label: string;
  value: string | number | boolean;
  active: boolean;
  note: string;
  contribution: number;
  observedSignals?: string[];
  observedSources?: RiskEvidenceLink[];
}

export interface RobloxUserProfile {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  avatarUrl: string;
  friendCount: number;
  hasVerifiedBadge: boolean;
  profileUrl: string;
  accountAgeDays: number;
}

export interface RobloxGameProfile {
  placeId: number;
  universeId: number;
  name: string;
  creatorName: string;
  creatorUrl: string;
  robloxUrl: string;
  description: string;
  thumbnailUrl: string;
  genres: string[];
  rating: number | null;
  ratingCount: number | null;
  created: string | null;
  updated: string | null;
  privateServersEnabled: boolean;
  associationSources: string[];
}

export interface FriendRiskSummary {
  id: number;
  name: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  score: number;
  level: RiskLevel;
  lastAssessed: string;
  factors: RiskFactor[];
  accountAgeDays: number;
}

export interface GameRiskSummary {
  id: string;
  placeId: number;
  universeId: number;
  name: string;
  creatorName: string;
  creatorUrl: string;
  robloxUrl: string;
  description: string;
  thumbnailUrl: string;
  score: number;
  level: RiskLevel;
  lastAssessed: string;
  factors: RiskFactor[];
  genres: string[];
  rating: number | null;
  ratingCount: number | null;
  created: string | null;
  updated: string | null;
  privateServersEnabled: boolean;
  associationSources: string[];
}

export interface UserAssessment {
  profile: RobloxUserProfile;
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  summary: string;
  mode: "phase0-preview";
  lastAssessed: string;
  friendsLastAssessed: string;
  gamesLastAssessed: string;
  notes: string[];
  highRiskFriends: FriendRiskSummary[];
  highRiskGames: GameRiskSummary[];
  scoredGames: GameRiskSummary[];
}

export interface SavedChildProfile {
  id: number;
  name: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  savedAt: string;
}
