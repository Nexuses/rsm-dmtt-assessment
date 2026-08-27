"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FormattedAnswer = {
  questionId: string;
  question: string;
  subject: string;
  answer: string;
};

type AssessmentSubmission = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  position: string;
  phone: string | null;
  website: string | null;
  totalScore: number;
  outcomeTitle: string;
  outcomeMessage: string;
  eligible: boolean;
  ineligibleReason: string | null;
  pdfS3Url: string | null;
  uploadedDocumentUrl: string | null;
  answers: Record<string, string>;
  formattedAnswers: FormattedAnswer[];
};

type ConsultationRequest = {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  score: number | null;
};

type SubmissionResponse = {
  assessments: AssessmentSubmission[];
  consultations: ConsultationRequest[];
};

type Props = {
  isConfigured: boolean;
  initialAuthenticated: boolean;
};

export function SubmissionsDashboard({ isConfigured, initialAuthenticated }: Props) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"assessments" | "consultations">("assessments");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(initialAuthenticated);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse>({
    assessments: [],
    consultations: [],
  });

  useEffect(() => {
    if (authenticated && isConfigured) {
      void loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, isConfigured]);

  const filteredAssessments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return submissions.assessments;
    return submissions.assessments.filter((item) =>
      [item.name, item.email, item.company].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, submissions.assessments]);

  const filteredConsultations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return submissions.consultations;
    return submissions.consultations.filter((item) =>
      [item.firstName, item.lastName, item.email, item.company || ""].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, submissions.consultations]);

  async function loadSubmissions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/submissions");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load submissions.");
      }

      setSubmissions(data as SubmissionResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load submissions.";
      setError(message);
      if (message === "Unauthorized.") {
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/submissions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setAuthenticated(true);
      setPassword("");
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/submissions/logout", { method: "POST" });
    setAuthenticated(false);
    setExpandedId(null);
    setSubmissions({ assessments: [], consultations: [] });
    setError(null);
  }

  async function handleDownloadCsv() {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions/export?type=${activeTab}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to download CSV.");
      }

      const blob = await response.blob();
      const filename =
        activeTab === "consultations"
          ? "consultation_requests.csv"
          : "assessment_submissions.csv";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download CSV.";
      setError(message);
      if (message === "Unauthorized.") {
        setAuthenticated(false);
      }
    } finally {
      setExporting(false);
    }
  }

  if (!isConfigured) {
    return (
      <Card className="border-[#009CD9]/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-[#1b3a57]">Submissions</CardTitle>
          <CardDescription>
            Set `SUBMISSIONS_PASSWORD` in your environment before using this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-[#009CD9]/20 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-[#1b3a57]">Submissions Login</CardTitle>
            <CardDescription>
              Enter the shared admin password to view received submissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter submissions password"
                autoComplete="current-password"
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                type="submit"
                className="w-full bg-[#009CD9] text-white hover:bg-[#0077a3]"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#1b3a57]">Submissions</h1>
          <p className="mt-1 text-sm text-slate-600">
            View all received assessment and consultation records.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or company"
            className="min-w-[280px] bg-white"
          />
          <Button variant="outline" onClick={() => void loadSubmissions()} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleDownloadCsv()}
            disabled={exporting || loading}
          >
            {exporting
              ? "Downloading..."
              : activeTab === "consultations"
                ? "Download consultations CSV"
                : "Download CSV"}
          </Button>
          <Button
            onClick={() => void handleLogout()}
            className="bg-[#1b3a57] text-white hover:bg-[#12273c]"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant={activeTab === "assessments" ? "default" : "outline"}
          className={cn(
            activeTab === "assessments" && "bg-[#009CD9] text-white hover:bg-[#0077a3]",
          )}
          onClick={() => setActiveTab("assessments")}
        >
          Assessments ({submissions.assessments.length})
        </Button>
        <Button
          variant={activeTab === "consultations" ? "default" : "outline"}
          className={cn(
            activeTab === "consultations" && "bg-[#3F9C35] text-white hover:bg-[#2f7828]",
          )}
          onClick={() => setActiveTab("consultations")}
        >
          Consultations ({submissions.consultations.length})
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {activeTab === "assessments" ? (
        <div className="space-y-4">
          {loading ? <p className="text-sm text-slate-600">Loading assessments...</p> : null}
          {!loading && filteredAssessments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-slate-600">
                No assessment submissions match your search.
              </CardContent>
            </Card>
          ) : null}
          {filteredAssessments.map((item) => (
            <Card key={item.id} className="overflow-hidden border-[#009CD9]/15 shadow-sm">
              <CardContent className="p-0">
                <div className="grid gap-4 border-l-4 border-[#009CD9] bg-white p-6 md:grid-cols-[2fr_2fr_2fr_1fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold text-[#1b3a57]">{item.name}</p>
                    <p className="text-sm text-slate-600">{item.email}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.company}</p>
                    <p className="text-sm text-slate-600">{item.position}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{new Date(item.createdAt).toLocaleString()}</p>
                    <p>{item.website || item.phone || "No extra contact info"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Outcome</p>
                    <p className="text-sm font-semibold text-[#1b3a57]">{item.outcomeTitle}</p>
                    <p className="text-xs text-slate-600">Score: {item.totalScore}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        item.eligible
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {item.eligible ? "In scope" : "Out of scope"}
                    </span>
                    {item.pdfS3Url ? (
                      <a
                        href={item.pdfS3Url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-[#009CD9] hover:underline"
                      >
                        View PDF
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">No PDF link</span>
                    )}
                    {item.uploadedDocumentUrl ? (
                      <a
                        href={item.uploadedDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-[#009CD9] hover:underline"
                      >
                        View upload
                      </a>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      {expandedId === item.id ? "Hide details" : "View details"}
                    </Button>
                  </div>
                </div>
                {expandedId === item.id ? (
                  <div className="border-t bg-slate-50 p-6">
                    <p className="mb-4 text-sm text-slate-700">{item.outcomeMessage}</p>
                    {item.ineligibleReason ? (
                      <p className="mb-4 text-sm text-amber-800">{item.ineligibleReason}</p>
                    ) : null}
                    <div className="grid gap-4 md:grid-cols-2">
                      {item.formattedAnswers.map((answer) => (
                        <div
                          key={answer.questionId}
                          className="rounded-xl border bg-white p-4 shadow-sm"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#009CD9]">
                            {answer.subject}
                          </p>
                          <p className="mt-2 font-medium text-[#1b3a57]">{answer.question}</p>
                          <p className="mt-2 text-sm text-slate-600">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? <p className="text-sm text-slate-600">Loading consultations...</p> : null}
          {!loading && filteredConsultations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-slate-600">
                No consultation requests match your search.
              </CardContent>
            </Card>
          ) : null}
          {filteredConsultations.map((item) => (
            <Card key={item.id} className="border-[#3F9C35]/20 shadow-sm">
              <CardContent className="grid gap-4 border-l-4 border-[#3F9C35] p-6 md:grid-cols-[2fr_2fr_2fr_1fr] md:items-center">
                <div>
                  <p className="font-semibold text-[#1b3a57]">
                    {item.firstName} {item.lastName}
                  </p>
                  <p className="text-sm text-slate-600">{item.email}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{item.company || "No company provided"}</p>
                  <p className="text-sm text-slate-600">{item.phone || "No phone provided"}</p>
                </div>
                <div className="text-sm text-slate-600">{new Date(item.createdAt).toLocaleString()}</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Score</p>
                  <p className="text-lg font-semibold text-[#3F9C35]">
                    {item.score !== null ? item.score : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
