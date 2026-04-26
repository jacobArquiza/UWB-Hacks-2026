import Link from "next/link";

import { SavedChildrenGrid } from "@/components/dashboard/saved-children-grid";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionSafe, isAuth0Configured } from "@/lib/auth0";
import {
  isSavedChildrenPersistenceConfigured,
  listSavedChildren,
} from "@/lib/saved-children-store";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getSessionSafe();

  if (!session?.user) {
    return (
      <div className="shell flex flex-1 items-center py-10">
        <Card className="mx-auto w-full max-w-2xl rounded-[2rem] border border-border bg-card">
          <CardHeader className="px-6 pt-6">
            <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
              Dashboard locked
            </p>
            <CardTitle className="font-heading text-4xl text-foreground">
              Log in to see saved children
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6 text-sm leading-7 text-muted-foreground">
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
                  "inline-flex rounded-[1.2rem] bg-primary text-primary-foreground hover:bg-primary/92",
                )}
              >
                Continue to sign in
              </a>
            ) : (
              <div
                id="auth0-setup"
                className="rounded-[1.4rem] border border-dashed border-border bg-foreground/[0.03] p-4 text-muted-foreground"
              >
                Sign-in is unavailable right now. Please try again later.
              </div>
            )}
            <Link href="/" className="block text-foreground hover:text-foreground/76">
              Back to landing page
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const savedChildren = isSavedChildrenPersistenceConfigured
    ? await listSavedChildren(session)
    : [];

  return (
    <SavedChildrenGrid
      viewerName={
        session.user.name ?? session.user.nickname ?? session.user.email ?? "you"
      }
      initialChildren={savedChildren}
      storageMode={isSavedChildrenPersistenceConfigured ? "supabase" : "local"}
    />
  );
}
