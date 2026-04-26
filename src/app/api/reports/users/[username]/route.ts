import { slugify } from "@/lib/format";
import { buildUserAssessment } from "@/lib/assessment";
import { buildReportText } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const assessment = await buildUserAssessment(decodedUsername);
  const reportText = buildReportText(assessment);

  return new Response(reportText, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${slugify(decodedUsername)}-roradar-report.txt"`,
    },
  });
}
