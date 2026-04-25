import { getRobloxUserByUsername } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  try {
    const profile = await getRobloxUserByUsername(decodeURIComponent(username));
    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to resolve Roblox user.",
      },
      { status: 404 },
    );
  }
}
