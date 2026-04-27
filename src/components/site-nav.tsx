"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { SiteSettingsDialog } from "@/components/site-settings-dialog";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteNavProps = {
  authConfigured: boolean;
  isLoggedIn: boolean;
  userLabel: string;
};

function NavPrimaryLinks({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <Link
        href="/about"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          compact
            ? "rounded-xl px-3 text-[0.9rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
            : "rounded-xl px-4 text-[0.95rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground lg:h-9 lg:px-5",
        )}
      >
        About
      </Link>
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          compact
            ? "rounded-xl px-3 text-[0.9rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
            : "rounded-xl px-4 text-[0.95rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground lg:h-9 lg:px-5",
        )}
      >
        Dashboard
      </Link>
    </>
  );
}

function NavSearchForm({
  id,
  initialUsername,
  mobile = false,
}: {
  id: string;
  initialUsername: string;
  mobile?: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [isPending, startTransition] = useTransition();

  function submitSearch(nextUsername = username.trim()) {
    if (!nextUsername) {
      return;
    }

    startTransition(() => {
      router.push(`/user/${encodeURIComponent(nextUsername)}`);
    });
  }

  return (
    <form
      className={mobile ? "border-t border-border/65 pt-3" : "w-full"}
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search Roblox username
      </label>
      <div
        className={cn(
          "group relative flex items-center gap-2 border border-border bg-foreground/[0.03] transition-all duration-300 ease-out focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/12",
          mobile
            ? "rounded-[1.25rem] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.12)]"
            : "rounded-[1.35rem] p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.12)] hover:border-foreground/[0.14]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            id={id}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Search Roblox username"
            className="h-10 border-0 bg-transparent px-0 text-sm text-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
          />
        </div>
        <button
          type="submit"
          className={cn(
            "inline-flex h-10 shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(40,80,255,0.2)] transition-all duration-300 ease-out hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-45",
            mobile
              ? "min-w-[3rem] rounded-[0.95rem] px-3"
              : "min-w-[3rem] rounded-[1rem] px-3 lg:min-w-[6.25rem]",
          )}
          disabled={!username.trim() || isPending}
        >
          {mobile ? null : <span className="hidden lg:inline">Search</span>}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}

export function SiteNav({
  authConfigured,
  isLoggedIn,
  userLabel,
}: SiteNavProps) {
  const pathname = usePathname();
  const authDisabled = !authConfigured;
  const isLanding = pathname === "/";
  const showInlineSearch = !isLanding;
  const currentUsername = pathname.startsWith("/user/")
    ? (() => {
        const encodedName = pathname.split("/").pop() ?? "";

        try {
          return decodeURIComponent(encodedName);
        } catch {
          return encodedName;
        }
      })()
    : "";

  return (
    <header className="z-40 px-4 pt-5 sm:px-6 sm:pt-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <nav className="rounded-[1.7rem] border border-border bg-card/88 shadow-[0_14px_44px_rgba(0,0,0,0.16)] backdrop-blur-xl">
          <div className="flex min-h-[4.9rem] flex-col gap-3 px-4 py-4 sm:px-5 md:px-7 md:py-4 lg:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <Link
                href="/"
                className="flex min-w-0 shrink-0 items-center px-1 transition-opacity hover:opacity-80"
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
              <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
                {showInlineSearch ? <SiteSettingsDialog /> : null}
                {showInlineSearch ? <NavPrimaryLinks compact /> : null}
                {isLoggedIn ? (
                  <a
                    href="/auth/logout"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-[0.95rem] border-border bg-foreground/[0.03] px-3 text-foreground hover:bg-foreground/[0.06] sm:h-9 sm:px-5",
                    )}
                  >
                    Log out
                  </a>
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

            <div className="hidden items-center gap-5 md:flex">
              <Link
                href="/"
                className="flex min-w-0 shrink-0 items-center px-1 transition-opacity hover:opacity-80"
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

              <div className="flex min-w-0 flex-1 items-center justify-center">
                <div
                  className={cn(
                    "flex items-center justify-center gap-1 transition-[max-width,opacity,transform] duration-300 ease-out",
                    isLanding
                      ? "max-w-md translate-y-0 opacity-100"
                      : "max-w-0 -translate-y-1 opacity-0 pointer-events-none",
                  )}
                >
                  <NavPrimaryLinks />
                </div>

                <div
                  className={cn(
                    "min-w-0 flex-1 overflow-hidden transition-[max-width,opacity,transform] duration-300 ease-out",
                    showInlineSearch
                      ? "max-w-full translate-y-0 opacity-100"
                      : "max-w-0 translate-y-1 opacity-0 pointer-events-none",
                  )}
                >
                  <div
                    className={cn(
                      "w-full transition-[transform,opacity] duration-300 ease-out",
                      showInlineSearch
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-1 scale-[0.985] opacity-0",
                    )}
                  >
                    <NavSearchForm
                      key={`desktop-${pathname}`}
                      id="navbar-roblox-username"
                      initialUsername={currentUsername}
                    />
                  </div>
                </div>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                {showInlineSearch ? <SiteSettingsDialog /> : null}
                {showInlineSearch ? <NavPrimaryLinks compact /> : null}
                {isLoggedIn ? (
                  <>
                    {showInlineSearch ? (
                      <Link
                        href="/dashboard"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "hidden rounded-xl px-3 text-[0.9rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground xl:inline-flex xl:h-9 xl:px-4",
                        )}
                      >
                        {userLabel}
                      </Link>
                    ) : null}
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
                        "rounded-xl px-3 text-[0.9rem] font-medium text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground sm:h-9 sm:px-4",
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

            <div
              className={cn(
                "overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out md:hidden",
                showInlineSearch
                  ? "max-h-28 translate-y-0 opacity-100"
                  : "max-h-0 -translate-y-1 opacity-0",
              )}
            >
              <NavSearchForm
                key={`mobile-${pathname}`}
                id="navbar-roblox-username-mobile"
                initialUsername={currentUsername}
                mobile
              />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
