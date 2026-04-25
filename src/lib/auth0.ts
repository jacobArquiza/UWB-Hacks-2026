import { Auth0Client } from "@auth0/nextjs-auth0/server";

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
