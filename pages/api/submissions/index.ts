import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { formatSubmissionAnswers } from "@/lib/submission-format";
import {
  isAuthenticatedRequest,
  isSubmissionsPasswordConfigured,
} from "@/lib/submissions-auth";

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

  const [assessments, consultations] = await Promise.all([
    db.assessmentSubmission.findMany({
      orderBy: { createdAt: "desc" },
    }),
    db.consultationRequest.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return res.status(200).json({
    assessments: assessments.map((item) => {
      const answers = (item.answers ?? {}) as Record<string, string>;
      return {
        ...item,
        answers,
        formattedAnswers: formatSubmissionAnswers(answers),
      };
    }),
    consultations,
  });
}
