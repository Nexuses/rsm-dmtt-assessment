import { questionsData } from "@/lib/questions";

export type SubmissionAttachment = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  url: string | null;
  source: "report" | "upload";
};

type ParsedFileAnswer = {
  questionId: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
};

function parseFileAnswers(answers: Record<string, string>): ParsedFileAnswer[] {
  const results: ParsedFileAnswer[] = [];

  for (const question of questionsData) {
    if (question.responseType !== "file") continue;
    const raw = answers[question.id];
    if (!raw?.trim()) continue;

    try {
      const parsed = JSON.parse(raw) as {
        fileName?: string;
        fileType?: string;
        fileSize?: number;
      };
      if (!parsed.fileName) continue;

      results.push({
        questionId: question.id,
        fileName: parsed.fileName,
        fileType: parsed.fileType || "application/octet-stream",
        fileSize: parsed.fileSize,
      });
    } catch {
      // ignore malformed file answers
    }
  }

  return results;
}

function filenameFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split("/").pop();
    if (!segment) return null;
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function getSubmissionAttachments(submission: {
  pdfS3Url: string | null;
  uploadedDocumentUrl: string | null;
  answers: Record<string, string>;
}): SubmissionAttachment[] {
  const attachments: SubmissionAttachment[] = [];
  const fileAnswers = parseFileAnswers(submission.answers);

  if (submission.pdfS3Url) {
    attachments.push({
      id: "pdf-report",
      fileName: "Assessment Report.pdf",
      fileType: "application/pdf",
      url: submission.pdfS3Url,
      source: "report",
    });
  }

  if (fileAnswers.length === 0 && submission.uploadedDocumentUrl) {
    attachments.push({
      id: "upload-0",
      fileName: filenameFromUrl(submission.uploadedDocumentUrl) || "Uploaded document",
      fileType: "application/octet-stream",
      url: submission.uploadedDocumentUrl,
      source: "upload",
    });
    return attachments;
  }

  fileAnswers.forEach((file, index) => {
    attachments.push({
      id: `upload-${file.questionId}`,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      url: index === 0 ? submission.uploadedDocumentUrl : null,
      source: "upload",
    });
  });

  return attachments;
}

export function isImageType(fileType: string): boolean {
  return fileType.startsWith("image/");
}

export function isPdfType(fileType: string, fileName: string): boolean {
  return fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

export function formatFileSize(bytes?: number): string {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "FILE";
  return parts.pop()?.toUpperCase() || "FILE";
}
