import { buildGameAssessmentById } from "@/lib/assessment";
import type { WideWebSearchMode } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  const payload = (await request.json().catch(() => null)) as
    | { streamProgress?: boolean; wideWebSearchMode?: WideWebSearchMode }
    | null;
  const encoder = new TextEncoder();

  try {
    if (payload?.streamProgress) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const game = await buildGameAssessmentById(Number(gameId), {
              wideWebSearchMode: payload?.wideWebSearchMode ?? "prefer-cache",
              onWideWebStage: (stage) => {
                controller.enqueue(
                  encoder.encode(`${JSON.stringify({ stage })}\n`),
                );
              },
            });
            controller.enqueue(encoder.encode(`${JSON.stringify({ game })}\n`));
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `${JSON.stringify({
                  error:
                    error instanceof Error
                      ? error.message
                      : "Could not refresh game.",
                })}\n`,
              ),
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "content-type": "application/x-ndjson; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    const game = await buildGameAssessmentById(Number(gameId), {
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
