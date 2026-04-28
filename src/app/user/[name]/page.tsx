import { TransitionLink as Link } from "@/components/transition-link";
import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildUserAssessment } from "@/lib/assessment";
import { getSessionSafe, isAuth0Configured } from "@/lib/auth0";
import { isGemmaWideWebClassifierEnabled } from "@/lib/gemma";

export const dynamic = "force-dynamic";

export default async function UserPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const username = decodeURIComponent(name);
  let assessment = null;
  let isLoggedIn = false;

  try {
    const [nextAssessment, session] = await Promise.all([
      buildUserAssessment(username),
      getSessionSafe(),
    ]);
    assessment = nextAssessment;
    isLoggedIn = Boolean(session?.user);
  } catch {
  }

  if (!assessment) {
    return (
      <div className="shell flex flex-1 items-center py-10">
        <Card className="mx-auto w-full max-w-2xl rounded-[2rem] border border-border bg-card">
          <CardHeader className="px-6 pt-6">
            <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
              Profile not found
            </p>
            <CardTitle className="font-heading text-4xl text-foreground">
              RoRadar could not find @{username}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 text-sm leading-7 text-muted-foreground">
            <p>
              RoRadar uses live Roblox user lookup, so this usually means the
              username does not exist or Roblox declined the request.
            </p>
            <Link href="/" className="text-foreground hover:text-foreground/76">
              Back to search
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AssessmentShell
      initialAssessment={assessment}
      authConfigured={isAuth0Configured}
      gemmaWideWebConfigured={isGemmaWideWebClassifierEnabled()}
      isLoggedIn={isLoggedIn}
    />
  );
}
