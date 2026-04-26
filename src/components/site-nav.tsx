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
          <div className="grid min-h-[4.9rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-5 sm:px-7 lg:px-8">
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

            <div className="hidden items-center gap-1 justify-self-center md:flex">
              <Link
                href="/about"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "rounded-xl px-5 text-[0.98rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
                )}
              >
                About
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "rounded-xl px-5 text-[0.98rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
                )}
              >
                Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-2.5 justify-self-end sm:gap-3">
              <SiteSettingsDialog />
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "lg" }),
                      "hidden rounded-xl px-4 text-[0.95rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground lg:inline-flex",
                    )}
                  >
                    {userLabel}
                  </Link>
                  <a
                    href="/auth/logout"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-[0.95rem] border-border bg-foreground/[0.03] px-5 text-foreground hover:bg-foreground/[0.06]",
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
                      buttonVariants({ variant: "ghost", size: "lg" }),
                      "hidden rounded-xl px-4 text-[0.95rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground sm:inline-flex",
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
                      buttonVariants({ size: "lg" }),
                      "rounded-[0.95rem] bg-primary px-5 text-primary-foreground shadow-[0_12px_30px_rgba(40,80,255,0.18)] hover:bg-primary/92",
                      authDisabled && "pointer-events-none opacity-45",
                    )}
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
