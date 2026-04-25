import { buildPreviewFriendById } from "@/lib/assessment";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ friendId: string }> },
) {
  const { friendId } = await params;

  try {
    const friend = await buildPreviewFriendById(Number(friendId));
    return Response.json({ friend });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not refresh friend.",
      },
      { status: 500 },
    );
  }
}
