import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { NextResponse } from "next/server";

const auth0Requirements = [
  "AUTH0_SECRET",
  "APP_BASE_URL",
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
] as const;

export const isAuth0Configured = auth0Requirements.every(
  (key) => Boolean(process.env[key]),
);

export const auth0 = isAuth0Configured
  ? new Auth0Client({
      domain: process.env.AUTH0_DOMAIN!,
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      secret: process.env.AUTH0_SECRET!,
      appBaseUrl: process.env.APP_BASE_URL!,
      onCallback: async (error, ctx) => {
        const appBaseUrl = ctx.appBaseUrl ?? process.env.APP_BASE_URL!;

        if (error) {
          const cause = (error as Error & { cause?: { code?: string; message?: string } }).cause;
          const errorCode =
            (error as Error & { code?: string }).code ?? "callback_error";
          const causeCode = cause?.code ?? "unknown_error";
          const diagnosticUrl = new URL("/auth/error", appBaseUrl);

          diagnosticUrl.searchParams.set("error", errorCode);
          diagnosticUrl.searchParams.set("cause", causeCode);

          console.error("[auth0] callback exchange failed", {
            errorName: error.name,
            errorCode,
            errorMessage: error.message,
            causeCode,
            causeMessage: cause?.message ?? null,
          });

          return NextResponse.redirect(diagnosticUrl);
        }

        const redirectUrl = new URL(ctx.returnTo || "/", appBaseUrl);
        return NextResponse.redirect(redirectUrl);
      },
    })
  : null;

export async function getSessionSafe() {
  if (!auth0) {
    return null;
  }

  try {
    return await auth0.getSession();
  } catch {
    return null;
  }
}

export async function getRequiredSession(): Promise<SessionData> {
  if (!auth0) {
    throw new Error("Auth0 is not configured.");
  }

  const session = await auth0.getSession();

  if (!session?.user) {
    throw new Error("Authentication is required.");
  }

  return session;
}
