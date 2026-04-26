import Image from "next/image";
import Link from "next/link";

import { SiteSettingsDialog } from "@/components/site-settings-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteNavProps = {
  authConfigured: boolean;
  isLoggedIn: boolean;
  userLabel: string;
};

export function SiteNav({
  authConfigured,
  isLoggedIn,
  userLabel,
}: SiteNavProps) {
  const authDisabled = !authConfigured;

  return (
    <header className="z-40 px-4 pt-5 sm:px-6 sm:pt-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <nav className="rounded-[1.7rem] border border-border bg-card/88 shadow-[0_14px_44px_rgba(0,0,0,0.16)] backdrop-blur-xl">
          <div className="flex min-h-[4.9rem] flex-col gap-3 px-4 py-4 sm:px-5 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-3 md:px-7 md:py-0 lg:px-8">
            <div className="flex items-center justify-between gap-3 md:contents">
              <Link
                href="/"
                className="flex min-w-0 items-center justify-self-start px-1 transition-opacity hover:opacity-80"
              >
                <Image
                  src="/branding/roradar-wordmark.png"
                  alt="RoRadar"
                  width={1092}
                  height={306}
                  priority
                  className="h-7 w-auto sm:h-8"
                />
              </Link>

              <div className="flex flex-wrap items-center justify-end gap-2 md:justify-self-end sm:gap-3">
                <SiteSettingsDialog />
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "hidden rounded-xl px-3 text-[0.9rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground lg:inline-flex lg:h-9 lg:px-4",
                      )}
                    >
                      {userLabel}
                    </Link>
                    <a
                      href="/auth/logout"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-[0.95rem] border-border bg-foreground/[0.03] px-3 text-foreground hover:bg-foreground/[0.06] sm:h-9 sm:px-5",
                      )}
                    >
                      Log out
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href={authConfigured ? "/auth/login" : "#auth0-setup"}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "hidden rounded-xl px-3 text-[0.9rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground sm:inline-flex sm:h-9 sm:px-4",
                        authDisabled && "pointer-events-none opacity-45",
                      )}
                    >
                      Login
                    </a>
                    <a
                      href={
                        authConfigured
                          ? "/auth/login?screen_hint=signup"
                          : "#auth0-setup"
                      }
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "rounded-[0.95rem] bg-primary px-3 text-primary-foreground shadow-[0_12px_30px_rgba(40,80,255,0.18)] hover:bg-primary/92 sm:h-9 sm:px-5",
                        authDisabled && "pointer-events-none opacity-45",
                      )}
                    >
                      Sign Up
                    </a>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 border-t border-border/65 pt-3 md:justify-self-center md:border-0 md:pt-0">
              <Link
                href="/about"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-xl px-3 text-[0.92rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground md:h-9 md:px-5 md:text-[0.98rem]",
                )}
              >
                About
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-xl px-3 text-[0.92rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground md:h-9 md:px-5 md:text-[0.98rem]",
                )}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
