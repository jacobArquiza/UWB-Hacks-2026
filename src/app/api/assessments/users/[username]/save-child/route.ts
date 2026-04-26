import { getRequiredSession, isAuth0Configured } from "@/lib/auth0";
import { getRobloxUserByUsername } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  try {
    if (!isAuth0Configured) {
      return Response.json(
        {
          error: "Auth0 is not configured yet.",
        },
        { status: 503 },
      );
    }

    await getRequiredSession();
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
      {
        status:
          error instanceof Error &&
          error.message === "Authentication is required."
            ? 401
            : 500,
      },
    );
  }
}
