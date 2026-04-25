import { buildPreviewGameById } from "@/lib/assessment";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;

  try {
    const game = await buildPreviewGameById(Number(gameId));
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
