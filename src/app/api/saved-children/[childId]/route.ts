import { getRequiredSession, isAuth0Configured } from "@/lib/auth0";
import {
  deleteSavedChildForSession,
  isSavedChildrenPersistenceConfigured,
} from "@/lib/saved-children-store";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const { childId } = await params;
  const parsedChildId = Number(childId);

  try {
    if (!isAuth0Configured) {
      return Response.json(
        {
          error: "Auth0 is not configured yet.",
        },
        { status: 503 },
      );
    }

    if (!Number.isInteger(parsedChildId) || parsedChildId <= 0) {
      return Response.json(
        {
          error: "Saved child id must be a positive integer.",
        },
        { status: 400 },
      );
    }

    if (!isSavedChildrenPersistenceConfigured) {
      return Response.json(
        {
          error: "Supabase saved-child persistence is not configured.",
        },
        { status: 503 },
      );
    }

    const session = await getRequiredSession();
    await deleteSavedChildForSession(session, parsedChildId);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not delete child.",
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
