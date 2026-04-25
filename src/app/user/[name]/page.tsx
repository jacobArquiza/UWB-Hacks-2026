import Link from "next/link";

import { AssessmentShell } from "@/components/assessment/assessment-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPreviewAssessment } from "@/lib/assessment";
import { getSessionSafe, isAuth0Configured } from "@/lib/auth0";

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
      buildPreviewAssessment(username),
      getSessionSafe(),
    ]);
    assessment = nextAssessment;
    isLoggedIn = Boolean(session?.user);
  } catch {
  }

  if (!assessment) {
    return (
      <div className="shell flex flex-1 items-center py-10">
        <Card className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#141518]">
          <CardHeader className="px-6 pt-6">
            <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
              Profile not found
            </p>
            <CardTitle className="font-heading text-4xl text-white">
              RoRadar could not find @{username}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 text-sm leading-7 text-white/58">
            <p>
              Phase 0 is wired against live Roblox user lookup, so this usually
              means the username does not exist or Roblox declined the request.
            </p>
            <Link href="/" className="text-white hover:text-white/76">
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
      isLoggedIn={isLoggedIn}
    />
  );
}
