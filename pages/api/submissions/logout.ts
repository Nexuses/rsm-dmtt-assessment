import type { NextApiRequest, NextApiResponse } from "next";
import { getClearSubmissionsCookieHeader } from "@/lib/submissions-auth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  res.setHeader("Set-Cookie", getClearSubmissionsCookieHeader());
  return res.status(200).json({ message: "Logged out successfully." });
}
