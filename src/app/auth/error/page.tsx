import { TransitionLink as Link } from "@/components/transition-link";
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
    title: "Sign-in could not be completed",
    detail: "The sign-in request was rejected before your session could finish.",
    checks: [
      "Return home and start a fresh sign-in attempt.",
      "Avoid reusing an older sign-in tab or callback page.",
      "If this keeps happening, contact support.",
    ],
  },
  unauthorized_client: {
    title: "This sign-in request was not accepted",
    detail:
      "The sign-in service did not allow this request to complete.",
    checks: [
      "Start a fresh sign-in attempt from the homepage.",
      "Make sure you complete sign-in in the same tab you started from.",
      "If this keeps happening, contact support.",
    ],
  },
  invalid_grant: {
    title: "This sign-in link expired",
    detail:
      "The sign-in session is no longer valid or no longer matches your current tab.",
    checks: [
      "Return home and start sign-in again.",
      "Avoid refreshing an older callback page.",
      "If this keeps happening, contact support.",
    ],
  },
  access_denied: {
    title: "Sign-in was stopped",
    detail:
      "Your account was not allowed to finish signing in.",
    checks: [
      "Try signing in again.",
      "If you believe you should have access, contact support.",
      "If this keeps happening, try again later.",
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
          Sign-in issue
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
              Error code
            </span>
            <span className="rounded-full border border-border bg-foreground/[0.04] px-3 py-1 font-medium text-foreground">
              {error}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="tracking-[0.18em] text-muted-foreground uppercase">
              Request state
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
            Try sign in again
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
