import Link from "next/link";
import { LayoutDashboard, RadioTower, ShieldAlert } from "lucide-react";

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
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-background/82 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-75"
        >
          <span className="flex size-9 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04]">
            <RadioTower className="size-4 text-white/90" />
          </span>
          <div className="min-w-0">
            <p className="font-heading text-sm tracking-[0.24em] text-white/55 uppercase">
              Placeholder Logo
            </p>
            <p className="font-heading text-base text-white">RoRadar</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/58 md:flex">
          <a href="#approach" className="hover:text-white">
            Approach
          </a>
          <a href="#preview" className="hover:text-white">
            Preview
          </a>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75 sm:flex">
                <ShieldAlert className="size-3.5 text-emerald-300" />
                <span className="max-w-36 truncate">{userLabel}</span>
              </div>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/12 bg-white/[0.02] text-white hover:bg-white/[0.06]",
                )}
              >
                <LayoutDashboard className="size-3.5" />
                Dashboard
              </Link>
              <a
                href="/auth/logout"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-white text-black hover:bg-white/85",
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
                  "text-white/78 hover:bg-white/[0.04] hover:text-white",
                  !authConfigured && "pointer-events-none opacity-45",
                )}
              >
                Log in
              </a>
              <a
                href={
                  authConfigured
                    ? "/auth/login?screen_hint=signup"
                    : "#auth0-setup"
                }
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "bg-white text-black hover:bg-white/85",
                  !authConfigured && "pointer-events-none opacity-45",
                )}
              >
                Sign up
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
