import Link from "next/link";

import { SavedChildrenGrid } from "@/components/dashboard/saved-children-grid";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionSafe, isAuth0Configured } from "@/lib/auth0";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSessionSafe();

  if (!session?.user) {
    return (
      <div className="shell flex flex-1 items-center py-10">
        <Card className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#141518]">
          <CardHeader className="px-6 pt-6">
            <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
              Dashboard locked
            </p>
            <CardTitle className="font-heading text-4xl text-white">
              Log in to see saved children
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6 text-sm leading-7 text-white/60">
            <p>
              The dashboard is reserved for signed-in parents. Once you log in,
              Save as Child on any profile report will pin that Roblox account
              here.
            </p>
            {isAuth0Configured ? (
              <a
                href="/auth/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex rounded-[1.2rem] bg-white text-black hover:bg-white/85",
                )}
              >
                Log in with Auth0
              </a>
            ) : (
              <div
                id="auth0-setup"
                className="rounded-[1.4rem] border border-dashed border-white/14 bg-white/[0.03] p-4 text-white/56"
              >
                Auth0 env variables are not configured yet. Add them in
                <code className="mx-1 rounded bg-black/20 px-1.5 py-0.5 text-white">
                  .env.local
                </code>
                to activate the real login flow.
              </div>
            )}
            <Link href="/" className="block text-white hover:text-white/76">
              Back to landing page
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SavedChildrenGrid
      viewerName={
        session.user.name ?? session.user.nickname ?? session.user.email ?? "you"
      }
    />
  );
}
