import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthErrorPageProps = {
  searchParams: Promise<{
    error?: string;
    cause?: string;
  }>;
};

const troubleshootingByCause: Record<
  string,
  {
    title: string;
    detail: string;
    checks: string[];
  }
> = {
  invalid_client: {
    title: "Client credentials were rejected",
    detail:
      "Auth0 did not accept the app credentials during the code exchange.",
    checks: [
      "Verify AUTH0_CLIENT_ID matches the RoRadar application in Auth0.",
      "Reveal the current Client Secret in Auth0, paste it into .env.local as AUTH0_CLIENT_SECRET, and restart the dev server.",
      "If you regenerated the secret recently, the old value will always fail here.",
    ],
  },
  unauthorized_client: {
    title: "The Auth0 application is not allowed to finish this exchange",
    detail:
      "This usually points to the application type or an application setting mismatch.",
    checks: [
      "Confirm the Auth0 Application Type is Regular Web Application.",
      "Confirm Token Endpoint Authentication Method is client_secret_post.",
      "Confirm the app you are editing is the same one referenced by AUTH0_CLIENT_ID.",
    ],
  },
  invalid_grant: {
    title: "The authorization code was rejected",
    detail:
      "This usually means the callback code was stale, replayed, or generated for a slightly different redirect URI.",
    checks: [
      "Retry the login from /auth/login instead of refreshing the callback page.",
      "Make sure APP_BASE_URL is exactly http://localhost:3000.",
      "Make sure the Auth0 Callback URL is exactly http://localhost:3000/auth/callback.",
      "If you changed .env.local, stop and fully restart the dev server before retrying.",
    ],
  },
  access_denied: {
    title: "Auth0 denied the token request",
    detail:
      "A policy, action, or connection rule blocked the exchange after login.",
    checks: [
      "Check Auth0 Dashboard > Monitoring > Logs for the failed transaction.",
      "Look for Actions, Rules, or connection-specific restrictions on this application.",
      "Retry with a basic email/password user to rule out a social/provider-specific issue.",
    ],
  },
};

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error ?? "callback_error";
  const cause = params.cause ?? "unknown_error";
  const troubleshooting =
    troubleshootingByCause[cause] ?? troubleshootingByCause.invalid_grant;

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl rounded-[2rem] border border-border bg-card/92 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-10">
        <div className="inline-flex items-center rounded-full border border-[#f0b95f]/22 bg-[#f0b95f]/10 px-3 py-1 text-[0.68rem] font-semibold tracking-[0.22em] text-[#f0b95f] uppercase">
          Auth callback failed
        </div>

        <h1 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-[2.2rem]">
          {troubleshooting.title}
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
          {troubleshooting.detail}
        </p>

        <div className="mt-8 grid gap-4 rounded-[1.35rem] border border-border bg-foreground/[0.03] p-5 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span className="tracking-[0.18em] text-muted-foreground uppercase">
              SDK error
            </span>
            <span className="rounded-full border border-border bg-foreground/[0.04] px-3 py-1 font-medium text-foreground">
              {error}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="tracking-[0.18em] text-muted-foreground uppercase">
              OAuth cause
            </span>
            <span className="rounded-full border border-border bg-foreground/[0.04] px-3 py-1 font-medium text-foreground">
              {cause}
            </span>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-[0.74rem] font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            What to check next
          </h2>
          <div className="mt-4 grid gap-3">
            {troubleshooting.checks.map((check) => (
              <div
                key={check}
                className="flex items-start gap-3 rounded-[1.1rem] border border-border bg-foreground/[0.02] px-4 py-3 text-sm leading-7 text-muted-foreground"
              >
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                <span>{check}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="/auth/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-[0.95rem] bg-primary px-5 text-primary-foreground shadow-[0_12px_30px_rgba(40,80,255,0.18)] hover:bg-primary/92",
            )}
          >
            Try Login Again
          </a>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-[0.95rem] border-border bg-foreground/[0.03] px-5 text-foreground hover:bg-foreground/[0.06]",
            )}
          >
            Return Home
          </Link>
        </div>
      </div>
    </section>
  );
}
