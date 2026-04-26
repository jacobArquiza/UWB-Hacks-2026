import { buildUserAssessment } from "@/lib/assessment";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  try {
    await request.json().catch(() => null);
    const assessment = await buildUserAssessment(decodeURIComponent(username));

    return Response.json({ assessment });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Refresh failed.",
      },
      { status: 500 },
    );
  }
}
