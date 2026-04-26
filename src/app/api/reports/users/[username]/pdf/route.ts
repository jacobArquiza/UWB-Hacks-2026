import { slugify } from "@/lib/format";
import { buildUserAssessment } from "@/lib/assessment";
import { buildReportPdf } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const assessment = await buildUserAssessment(decodedUsername);
  const reportPdf = await buildReportPdf(assessment);
  const reportBuffer = new ArrayBuffer(reportPdf.byteLength);
  new Uint8Array(reportBuffer).set(reportPdf);
  const reportBody = new Blob([reportBuffer], { type: "application/pdf" });
  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";

  return new Response(reportBody, {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `${download ? "attachment" : "inline"}; filename="${slugify(decodedUsername)}-roradar-report.pdf"`,
      "content-type": "application/pdf",
    },
  });
}
