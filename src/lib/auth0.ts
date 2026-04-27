import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { NextResponse } from "next/server";

const auth0Requirements = [
  "AUTH0_SECRET",
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
] as const;

function getNormalizedUrlOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function buildAllowedAppBaseUrls() {
  const candidates = [
    process.env.APP_BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`
      : null,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : null,
    "https://roradar.vercel.app",
    "http://localhost:3000",
  ];

  const seen = new Set<string>();

  return candidates.flatMap((candidate) => {
    if (!candidate) {
      return [];
    }

    const origin = getNormalizedUrlOrigin(candidate);

    if (!origin || seen.has(origin)) {
      return [];
    }

    seen.add(origin);
    return [origin];
  });
}

export const isAuth0Configured =
  auth0Requirements.every((key) => Boolean(process.env[key]));

const allowedAppBaseUrls = buildAllowedAppBaseUrls();

export const auth0 = isAuth0Configured
  ? new Auth0Client({
      domain: process.env.AUTH0_DOMAIN!,
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      secret: process.env.AUTH0_SECRET!,
      // Let the SDK infer the active host from each request, but constrain it
      // to the domains this app is expected to run on.
      appBaseUrl: allowedAppBaseUrls,
      transactionCookie: {
        secure: process.env.NODE_ENV === "production",
      },
      session: {
        cookie: {
          secure: process.env.NODE_ENV === "production",
        },
      },
      onCallback: async (error, ctx) => {
        const callbackBaseUrl = ctx.appBaseUrl;

        if (!callbackBaseUrl) {
          throw new Error("Auth callback base URL could not be resolved.");
        }

        if (error) {
          const cause = (error as Error & { cause?: { code?: string; message?: string } }).cause;
          const errorCode =
            (error as Error & { code?: string }).code ?? "callback_error";
          const causeCode = cause?.code ?? "unknown_error";
          const diagnosticUrl = new URL("/auth/error", callbackBaseUrl);

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

        const redirectUrl = new URL(ctx.returnTo || "/", callbackBaseUrl);
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
