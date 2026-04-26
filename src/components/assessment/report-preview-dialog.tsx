"use client";

import { Download, FileText, LoaderCircle } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ReportPreviewDialogProps = {
  downloadUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviewLoaded: () => void;
  previewLoading: boolean;
  previewUrl: string;
  username: string;
};

export function ReportPreviewDialog({
  downloadUrl,
  open,
  onOpenChange,
  onPreviewLoaded,
  previewLoading,
  previewUrl,
  username,
}: ReportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(40vw,calc(100vw-1rem))] min-w-[22rem] max-w-[40vw] overflow-hidden rounded-[1.75rem] border border-border bg-popover/96 p-0 text-popover-foreground shadow-[0_36px_120px_rgba(0,0,0,0.24)] sm:max-w-[40vw]"
        showCloseButton
      >
        <div className="max-h-[88dvh] overflow-y-auto">
          <div className="p-5 sm:p-6 lg:p-8">
            <DialogHeader className="gap-3 text-left">
              <p className="text-[0.72rem] tracking-[0.2em] text-muted-foreground uppercase">
                Report
              </p>
              <DialogTitle className="font-heading text-[2rem] leading-[0.96] font-semibold tracking-[-0.05em] text-foreground sm:text-[2.4rem]">
                Parent PDF for @{username}
              </DialogTitle>
              <DialogDescription className="max-w-3xl text-base text-muted-foreground">
                Review the generated PDF here, then download the same file when
                you are ready.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 rounded-[1.4rem] border border-border bg-foreground/[0.025] p-3 sm:p-4">
              <div className="relative overflow-hidden rounded-[1.15rem] border border-border bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                {previewLoading ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 text-slate-600">
                    <LoaderCircle className="size-5 animate-spin" />
                    <p className="text-sm font-medium">Rendering PDF</p>
                  </div>
                ) : null}
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  title={`RoRadar report for ${username}`}
                  className="h-[72dvh] min-h-[32rem] w-full bg-white"
                  onLoad={onPreviewLoaded}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
                <p className="text-sm text-muted-foreground">
                  If your browser blocks the embedded PDF viewer, use the
                  download button below.
                </p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-foreground/75 transition-colors hover:text-foreground"
                >
                  Open in new tab
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 rounded-full border-border bg-foreground/[0.03] px-5 text-[0.88rem] text-foreground hover:bg-foreground/[0.06]"
              >
                <FileText className="size-4" />
                Back to report
              </Button>
              <a
                href={downloadUrl}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex h-11 rounded-full bg-primary px-5 text-[0.88rem] text-primary-foreground hover:bg-primary/92",
                )}
              >
                <Download className="size-4" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
