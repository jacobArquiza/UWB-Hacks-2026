const gemmaApiBaseUrl = "https://generativelanguage.googleapis.com/v1beta";
const defaultGemmaModel = "gemma-4-31b-it";
const maxEvidenceExcerptLength = 1000;

export type GemmaWideWebCandidate = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  rawContent: string;
};

export type GemmaWideWebClassification = {
  id: string;
  gameSpecific: boolean;
  supportsRiskContribution: boolean;
  riskCategory: string;
  confidence: number;
  rationale: string;
  evidenceBullets: string[];
};

type GenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

function getGemmaApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ""
  );
}

function getGemmaModelName() {
  return process.env.GEMMA_MODEL || defaultGemmaModel;
}

function trimEvidenceText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxEvidenceExcerptLength);
}

function buildGemmaPrompt(gameName: string, candidates: GemmaWideWebCandidate[]) {
  const candidatePayload = candidates.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    url: candidate.url,
    snippet: trimEvidenceText(candidate.snippet),
    excerpt: trimEvidenceText(candidate.rawContent),
  }));

  return [
    "You are validating web search evidence for a Roblox parental-awareness tool.",
    `Target game: "${gameName}"`,
    "Decide whether each result is specifically about this exact Roblox game, not Roblox generally.",
    "If the game title is generic, require the exact title or unmistakable unique context before treating it as game-specific.",
    "Generic Roblox safety coverage, generic voice chat coverage, or platform-level predator coverage is not game-specific.",
    "Only set supportsRiskContribution=true when BOTH are true:",
    "1. the result is specifically about the exact target game",
    "2. the result describes predatory solicitation, grooming, unsafe sexualized roleplay, inappropriate stranger contact, or a similar safety-relevant concern",
    "Use these riskCategory labels: predatory_solicitation, unsafe_roleplay, generic_platform_safety, irrelevant, unclear.",
    "Return JSON only.",
    JSON.stringify({ candidates: candidatePayload }),
  ].join("\n");
}

function parseClassificationArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as GemmaWideWebClassification[];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const candidate = entry as Partial<GemmaWideWebClassification>;

    if (
      typeof candidate.id !== "string" ||
      typeof candidate.gameSpecific !== "boolean" ||
      typeof candidate.supportsRiskContribution !== "boolean" ||
      typeof candidate.riskCategory !== "string" ||
      typeof candidate.confidence !== "number" ||
      typeof candidate.rationale !== "string" ||
      !Array.isArray(candidate.evidenceBullets)
    ) {
      return [];
    }

    return [
      {
        id: candidate.id,
        gameSpecific: candidate.gameSpecific,
        supportsRiskContribution: candidate.supportsRiskContribution,
        riskCategory: candidate.riskCategory,
        confidence: Math.max(0, Math.min(1, candidate.confidence)),
        rationale: candidate.rationale.trim(),
        evidenceBullets: candidate.evidenceBullets
          .filter((bullet): bullet is string => typeof bullet === "string")
          .map((bullet) => bullet.trim())
          .filter(Boolean)
          .slice(0, 3),
      } satisfies GemmaWideWebClassification,
    ];
  });
}

export function isGemmaWideWebClassifierEnabled() {
  return Boolean(getGemmaApiKey());
}

export function getGemmaWideWebClassifierLabel() {
  return "Gemma 4";
}

export async function classifyWideWebEvidenceBatch(params: {
  gameName: string;
  candidates: GemmaWideWebCandidate[];
}) {
  const apiKey = getGemmaApiKey();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!params.candidates.length) {
    return [] as GemmaWideWebClassification[];
  }

  const response = await fetch(
    `${gemmaApiBaseUrl}/models/${getGemmaModelName()}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildGemmaPrompt(params.gameName, params.candidates),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 900,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              classifications: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    gameSpecific: { type: "BOOLEAN" },
                    supportsRiskContribution: { type: "BOOLEAN" },
                    riskCategory: { type: "STRING" },
                    confidence: { type: "NUMBER" },
                    rationale: { type: "STRING" },
                    evidenceBullets: {
                      type: "ARRAY",
                      items: { type: "STRING" },
                    },
                  },
                  required: [
                    "id",
                    "gameSpecific",
                    "supportsRiskContribution",
                    "riskCategory",
                    "confidence",
                    "rationale",
                    "evidenceBullets",
                  ],
                },
              },
            },
            required: ["classifications"],
          },
        },
      }),
      signal: AbortSignal.timeout(25000),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Gemma classification failed with ${response.status}${detail ? `: ${detail}` : ""}`,
    );
  }

  const payload = (await response.json()) as GenerateContentResponse;
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemma classification returned no text.");
  }

  const parsed = JSON.parse(text) as {
    classifications?: unknown;
  };

  return parseClassificationArray(parsed.classifications);
}
