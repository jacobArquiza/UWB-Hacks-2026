import { slugify } from "@/lib/format";
import { buildPreviewAssessment } from "@/lib/assessment";
import { buildPhase0ReportPdf } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const assessment = await buildPreviewAssessment(decodedUsername);
  const reportPdf = await buildPhase0ReportPdf(assessment);
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";

  return new Response(reportPdf, {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${slugify(decodedUsername)}-roradar-report.pdf"`,
      "content-type": "application/pdf",
    },
  });
}
