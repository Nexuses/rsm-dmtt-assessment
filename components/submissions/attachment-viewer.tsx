"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Paperclip,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatFileSize,
  getFileExtension,
  isImageType,
  isPdfType,
  type SubmissionAttachment,
} from "@/lib/submission-attachments";
import { cn } from "@/lib/utils";

type Props = {
  attachments: SubmissionAttachment[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
};

export function AttachmentViewer({ attachments, initialIndex = 0, open, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [previewFailed, setPreviewFailed] = useState(false);

  const current = attachments[currentIndex];
  const hasMultiple = attachments.length > 1;

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setPreviewFailed(false);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    setPreviewFailed(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
      if (event.key === "ArrowRight" && currentIndex < attachments.length - 1) {
        setCurrentIndex((i) => i + 1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, currentIndex, attachments.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(attachments.length - 1, i + 1));
  }, [attachments.length]);

  if (!open || !current) return null;

  const canPreview =
    current.url &&
    !previewFailed &&
    (isImageType(current.fileType) || isPdfType(current.fileType, current.fileName));

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Attachment viewer"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#009CD9]/20 bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-[#1b3a57]">{current.fileName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{getFileExtension(current.fileName)}</Badge>
              {current.fileSize ? (
                <span className="text-xs text-slate-500">{formatFileSize(current.fileSize)}</span>
              ) : null}
              {current.source === "report" ? (
                <Badge variant="default">Report</Badge>
              ) : (
                <Badge variant="secondary">Upload</Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex min-h-[240px] flex-1 items-center justify-center overflow-auto bg-slate-50 p-5">
          {canPreview && isImageType(current.fileType) && current.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.fileName}
              className="max-h-[50vh] max-w-full rounded-lg object-contain"
              onError={() => setPreviewFailed(true)}
            />
          ) : canPreview && isPdfType(current.fileType, current.fileName) && current.url ? (
            <iframe
              src={current.url}
              title={current.fileName}
              className="h-[50vh] w-full rounded-lg border border-slate-200 bg-white"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-sm">
                <FileText className="h-8 w-8 text-[#009CD9]" />
              </div>
              <p className="text-sm font-medium text-[#1b3a57]">{current.fileName}</p>
              <p className="max-w-sm text-xs text-slate-500">
                {current.url
                  ? "Preview unavailable. Open or download the file using the actions below."
                  : "File metadata only — no download link available for this attachment."}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            {hasMultiple ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  aria-label="Previous attachment"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-xs text-slate-500">
                  {currentIndex + 1} of {attachments.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goNext}
                  disabled={currentIndex === attachments.length - 1}
                  aria-label="Next attachment"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <span className="text-xs text-slate-500">1 attachment</span>
            )}
          </div>

          {current.url ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={current.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              </Button>
              <Button
                size="sm"
                className="bg-[#009CD9] text-white hover:bg-[#0077a3]"
                asChild
              >
                <a href={current.url} download={current.fileName} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AttachmentCellButton({
  count,
  onClick,
  className,
}: {
  count: number;
  onClick: () => void;
  className?: string;
}) {
  if (count === 0) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#009CD9] transition-colors hover:bg-[#e6f5fc]",
        className,
      )}
    >
      <Paperclip className="h-3.5 w-3.5" />
      {count} {count === 1 ? "attachment" : "attachments"}
    </button>
  );
}
