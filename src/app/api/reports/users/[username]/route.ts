import { slugify } from "@/lib/format";
import { buildPreviewAssessment } from "@/lib/assessment";
import { buildPhase0ReportText } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const assessment = await buildPreviewAssessment(decodedUsername);
  const reportText = buildPhase0ReportText(assessment);

  return new Response(reportText, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${slugify(decodedUsername)}-roradar-report.txt"`,
    },
  });
}
