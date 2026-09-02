"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AttachmentCellButton,
  AttachmentViewer,
} from "@/components/submissions/attachment-viewer";
import {
  DEFAULT_FILTERS,
  hasDateFilters,
  hasSearchFilter,
  SubmissionsToolbar,
  type SubmissionsFilterState,
} from "@/components/submissions/submissions-toolbar";
import {
  PAGE_SIZE_OPTIONS,
  SubmissionsPagination,
} from "@/components/submissions/submissions-pagination";
import { getSubmissionAttachments } from "@/lib/submission-attachments";

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

type SubmissionResponse = {
  assessments: AssessmentSubmission[];
};

type Props = {
  isConfigured: boolean;
  initialAuthenticated: boolean;
};

function formatSubmittedDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function matchesDateFilters(item: AssessmentSubmission, filters: SubmissionsFilterState): boolean {
  const date = new Date(item.createdAt);

  if (filters.year !== "all" && date.getFullYear() !== Number(filters.year)) {
    return false;
  }

  if (filters.month !== "all" && date.getMonth() !== Number(filters.month)) {
    return false;
  }

  return true;
}

function matchesSearch(item: AssessmentSubmission, query: string): boolean {
  if (!query) return true;
  const haystack = [
    item.name,
    item.email,
    item.company,
    item.position,
    item.outcomeTitle,
  ].map((value) => value.toLowerCase());
  return haystack.some((value) => value.includes(query));
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="mb-1 h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="mb-1 h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="mb-1 h-4 w-36" />
            <Skeleton className="h-3 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-4" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SubmissionsDashboard({ isConfigured, initialAuthenticated }: Props) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [filters, setFilters] = useState<SubmissionsFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[1]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(initialAuthenticated);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentSubmission[]>([]);
  const [viewerState, setViewerState] = useState<{
    open: boolean;
    attachments: ReturnType<typeof getSubmissionAttachments>;
    initialIndex: number;
  }>({ open: false, attachments: [], initialIndex: 0 });

  useEffect(() => {
    if (authenticated && isConfigured) {
      void loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, isConfigured]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const item of assessments) {
      years.add(new Date(item.createdAt).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return assessments.filter((item) => {
      if (!matchesSearch(item, query)) return false;
      if (!matchesDateFilters(item, filters)) return false;

      if (filters.eligibility === "eligible" && !item.eligible) return false;
      if (filters.eligibility === "ineligible" && item.eligible) return false;

      const attachmentCount = getSubmissionAttachments(item).length;
      if (filters.attachmentFilter === "with" && attachmentCount === 0) return false;
      if (filters.attachmentFilter === "without" && attachmentCount > 0) return false;

      return true;
    });
  }, [assessments, filters]);

  const paginatedAssessments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssessments.slice(start, start + pageSize);
  }, [filteredAssessments, page, pageSize]);

  const emptyMessage = useMemo(() => {
    if (assessments.length === 0) {
      return "No assessment submissions yet.";
    }
    if (hasSearchFilter(filters)) {
      return "No assessments match your search.";
    }
    if (hasDateFilters(filters)) {
      return "No assessments for the selected period.";
    }
    return "No assessments match the current filters.";
  }, [assessments.length, filters]);

  async function loadSubmissions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/submissions");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load submissions.");
      }

      const payload = data as SubmissionResponse & { consultations?: unknown[] };
      setAssessments(payload.assessments ?? []);
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
    setAssessments([]);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setError(null);
  }

  async function handleDownloadCsv() {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch("/api/submissions/export?type=assessments");

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to download CSV.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "assessment_submissions.csv";
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

  function openAttachmentViewer(item: AssessmentSubmission) {
    const attachments = getSubmissionAttachments(item);
    if (attachments.length === 0) return;
    setViewerState({ open: true, attachments, initialIndex: 0 });
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
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold text-[#1b3a57]">Submissions</h1>
        <p className="mt-1 text-sm text-slate-600">
          View all received assessment submissions.
        </p>
      </div>

      <SubmissionsToolbar
        filters={filters}
        onFiltersChange={setFilters}
        yearOptions={yearOptions}
        onRefresh={() => void loadSubmissions()}
        onExport={() => void handleDownloadCsv()}
        onLogout={() => void handleLogout()}
        loading={loading}
        exporting={exporting}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[140px]">Submitted</TableHead>
                <TableHead className="min-w-[180px]">Name</TableHead>
                <TableHead className="min-w-[160px]">Company</TableHead>
                <TableHead className="min-w-[180px]">Outcome</TableHead>
                <TableHead className="min-w-[110px]">Status</TableHead>
                <TableHead className="min-w-[130px]">Attachments</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeletonRows />
              ) : paginatedAssessments.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-32 text-center text-sm text-slate-500">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAssessments.map((item) => {
                  const attachments = getSubmissionAttachments(item);
                  const isExpanded = expandedId === item.id;

                  return (
                    <Fragment key={item.id}>
                      <TableRow>
                        <TableCell className="whitespace-nowrap text-sm text-slate-600">
                          {formatSubmittedDate(item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <p
                            className="truncate font-medium text-[#1b3a57]"
                            title={item.name}
                          >
                            {item.name}
                          </p>
                          <p className="truncate text-xs text-slate-500" title={item.email}>
                            {item.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="truncate font-medium text-slate-900" title={item.company}>
                            {item.company}
                          </p>
                          <p className="truncate text-xs text-slate-500" title={item.position}>
                            {item.position}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p
                            className="truncate text-sm font-medium text-[#1b3a57]"
                            title={item.outcomeTitle}
                          >
                            {item.outcomeTitle}
                          </p>
                          <p className="text-xs text-slate-500">Score: {item.totalScore}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.eligible ? "success" : "warning"}>
                            {item.eligible ? "In scope" : "Out of scope"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AttachmentCellButton
                            count={attachments.length}
                            onClick={() => openAttachmentViewer(item)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {isExpanded ? (
                        <TableRow key={`${item.id}-details`} className="hover:bg-transparent">
                          <TableCell colSpan={7} className="bg-slate-50 p-0">
                            <div className="border-t border-slate-200 p-5">
                              <p className="mb-3 text-sm text-slate-700">{item.outcomeMessage}</p>
                              {item.ineligibleReason ? (
                                <p className="mb-4 text-sm text-amber-800">
                                  {item.ineligibleReason}
                                </p>
                              ) : null}
                              {(item.website || item.phone) && (
                                <p className="mb-4 text-xs text-slate-500">
                                  {[item.website, item.phone].filter(Boolean).join(" · ")}
                                </p>
                              )}
                              <div className="grid gap-3 md:grid-cols-2">
                                {item.formattedAnswers.map((answer) => (
                                  <div
                                    key={answer.questionId}
                                    className="rounded-lg border border-slate-200 bg-white p-4"
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#009CD9]">
                                      {answer.subject}
                                    </p>
                                    <p className="mt-1.5 font-medium text-[#1b3a57]">
                                      {answer.question}
                                    </p>
                                    <p className="mt-1.5 text-sm text-slate-600">{answer.answer}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <SubmissionsPagination
          page={page}
          pageSize={pageSize}
          totalCount={filteredAssessments.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <AttachmentViewer
        open={viewerState.open}
        attachments={viewerState.attachments}
        initialIndex={viewerState.initialIndex}
        onClose={() => setViewerState((state) => ({ ...state, open: false }))}
      />
    </div>
  );
}
