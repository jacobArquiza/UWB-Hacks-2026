import { buildPreviewGameById } from "@/lib/assessment";
import type { WideWebSearchMode } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | { wideWebSearchMode?: WideWebSearchMode }
    | null;

  try {
    const game = await buildPreviewGameById(Number(gameId), {
      wideWebSearchMode: payload?.wideWebSearchMode ?? "prefer-cache",
    });
    return Response.json({ game });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not refresh game.",
      },
      { status: 500 },
    );
  }
}
