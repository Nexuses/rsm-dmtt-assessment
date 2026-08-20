import type { NextApiRequest, NextApiResponse } from "next";
import {
  getSubmissionsCookieHeader,
  isSubmissionsPasswordConfigured,
} from "@/lib/submissions-auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!isSubmissionsPasswordConfigured()) {
    return res.status(500).json({ message: "SUBMISSIONS_PASSWORD is not configured." });
  }

  const { password } = req.body as { password?: string };
  if (!password || password !== process.env.SUBMISSIONS_PASSWORD) {
    return res.status(401).json({ message: "Incorrect password." });
  }

  res.setHeader("Set-Cookie", getSubmissionsCookieHeader());
  return res.status(200).json({ message: "Authenticated successfully." });
}
