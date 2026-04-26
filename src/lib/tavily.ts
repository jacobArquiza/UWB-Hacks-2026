type TavilySearchDepth = "advanced" | "basic" | "fast" | "ultra-fast";
type TavilyTopic = "general" | "news";

type TavilySearchRequest = {
  query: string;
  topic?: TavilyTopic;
  search_depth?: TavilySearchDepth;
  max_results?: number;
  include_answer?: boolean;
  include_raw_content?: boolean | "markdown" | "text";
  exact_match?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
};

export type TavilySearchResult = {
  title: string;
  url: string;
  content?: string;
  raw_content?: string;
  score?: number;
};

type TavilySearchResponse = {
  results?: TavilySearchResult[];
  response_time?: number;
};

const tavilyBaseUrl = "https://api.tavily.com";

export function isWideWebGameScanEnabled() {
  return (
    Boolean(process.env.TAVILY_API_KEY) &&
    process.env.ENABLE_WIDE_WEB_GAME_SCAN === "true"
  );
}

export async function tavilySearch(
  request: TavilySearchRequest,
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not configured.");
  }

  const response = await fetch(`${tavilyBaseUrl}/search`, {
    method: "POST",
    cache: "no-store",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    let message = detail;

    try {
      const parsed = JSON.parse(detail) as {
        detail?: {
          error?: string;
        };
      };
      message = parsed.detail?.error ?? detail;
    } catch {
      message = detail;
    }

    throw new Error(
      `Tavily search failed with ${response.status}${message ? `: ${message}` : ""}`,
    );
  }

  return (await response.json()) as TavilySearchResponse;
}
