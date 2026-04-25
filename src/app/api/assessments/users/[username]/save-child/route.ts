import { getRobloxUserByUsername } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  try {
    const profile = await getRobloxUserByUsername(decodeURIComponent(username));

    return Response.json({
      child: {
        id: profile.id,
        name: profile.name,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        profileUrl: profile.profileUrl,
        savedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not save child.",
      },
      { status: 500 },
    );
  }
}
