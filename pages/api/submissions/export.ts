import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import {
  isAuthenticatedRequest,
  isSubmissionsPasswordConfigured,
} from "@/lib/submissions-auth";

function csvEscape(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!isSubmissionsPasswordConfigured()) {
    return res.status(500).json({ message: "SUBMISSIONS_PASSWORD is not configured." });
  }

  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const type = req.query.type === "consultations" ? "consultations" : "assessments";

  if (type === "consultations") {
    const consultations = await db.consultationRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    const csv = toCsv(
      ["id", "createdAt", "firstName", "lastName", "email", "phone", "company", "score"],
      consultations.map((item) => [
        item.id,
        item.createdAt.toISOString(),
        item.firstName,
        item.lastName,
        item.email,
        item.phone,
        item.company,
        item.score,
      ]),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="consultation_requests.csv"',
    );
    return res.status(200).send(csv);
  }

  const assessments = await db.assessmentSubmission.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      name: true,
      email: true,
      company: true,
      position: true,
      phone: true,
      website: true,
      totalScore: true,
      outcomeTitle: true,
      eligible: true,
      ineligibleReason: true,
      pdfS3Url: true,
      uploadedDocumentUrl: true,
    },
  });

  const csv = toCsv(
    [
      "id",
      "createdAt",
      "name",
      "email",
      "company",
      "position",
      "phone",
      "website",
      "totalScore",
      "outcomeTitle",
      "eligible",
      "ineligibleReason",
      "pdfS3Url",
      "uploadedDocumentUrl",
    ],
    assessments.map((item) => [
      item.id,
      item.createdAt.toISOString(),
      item.name,
      item.email,
      item.company,
      item.position,
      item.phone,
      item.website,
      item.totalScore,
      item.outcomeTitle,
      item.eligible,
      item.ineligibleReason,
      item.pdfS3Url,
      item.uploadedDocumentUrl,
    ]),
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="assessment_submissions.csv"',
  );
  return res.status(200).send(csv);
}
