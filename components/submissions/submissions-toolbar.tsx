"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type EligibilityFilter = "all" | "eligible" | "ineligible";
export type AttachmentFilter = "all" | "with" | "without";

export type SubmissionsFilterState = {
  search: string;
  month: string;
  year: string;
  eligibility: EligibilityFilter;
  attachmentFilter: AttachmentFilter;
};

export const DEFAULT_FILTERS: SubmissionsFilterState = {
  search: "",
  month: "all",
  year: "all",
  eligibility: "all",
  attachmentFilter: "all",
};

const MONTHS = [
  { value: "all", label: "All months" },
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

type Props = {
  filters: SubmissionsFilterState;
  onFiltersChange: (filters: SubmissionsFilterState) => void;
  yearOptions: number[];
  onRefresh: () => void;
  onExport: () => void;
  onLogout: () => void;
  loading: boolean;
  exporting: boolean;
};

function selectClassName(active?: boolean) {
  return cn(
    "h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-[#1b3a57] outline-none transition-colors",
    "focus-visible:ring-2 focus-visible:ring-[#00AEEF]/30 focus-visible:ring-offset-0",
    active && "border-[#009CD9]/40 bg-[#f8fbfd]",
  );
}

export function SubmissionsToolbar({
  filters,
  onFiltersChange,
  yearOptions,
  onRefresh,
  onExport,
  onLogout,
  loading,
  exporting,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.month !== "all" ||
    filters.year !== "all" ||
    filters.eligibility !== "all" ||
    filters.attachmentFilter !== "all";

  const hasPopoverFilters =
    filters.eligibility !== "all" || filters.attachmentFilter !== "all";

  useEffect(() => {
    if (!filtersOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        filtersPanelRef.current?.contains(target) ||
        filtersButtonRef.current?.contains(target)
      ) {
        return;
      }
      setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filtersOpen]);

  function update(partial: Partial<SubmissionsFilterState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  function clearFilters() {
    onFiltersChange({ ...DEFAULT_FILTERS });
  }

  const yearSelectOptions = [
    { value: "all", label: "All years" },
    ...yearOptions.map((y) => ({ value: String(y), label: String(y) })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.search}
              onChange={(event) => update({ search: event.target.value })}
              placeholder="Search assessments..."
              className="h-9 bg-white pl-9 pr-9 focus-visible:ring-[#00AEEF]/30"
            />
            {filters.search ? (
              <button
                type="button"
                onClick={() => update({ search: "" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <select
            aria-label="Filter by month"
            value={filters.month}
            onChange={(event) => update({ month: event.target.value })}
            className={selectClassName(filters.month !== "all")}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by year"
            value={filters.year}
            onChange={(event) => update({ year: event.target.value })}
            className={selectClassName(filters.year !== "all")}
          >
            {yearSelectOptions.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Button
              ref={filtersButtonRef}
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-1.5",
                hasPopoverFilters && "border-[#009CD9]/40 bg-[#f8fbfd] text-[#0077a3]",
              )}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </Button>

            {filtersOpen && typeof document !== "undefined"
              ? createPortal(
                  <div
                    ref={filtersPanelRef}
                    className="fixed z-[9999] w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(27,58,87,0.18)]"
                    style={{
                      top: (filtersButtonRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
                      left: filtersButtonRef.current?.getBoundingClientRect().left ?? 0,
                    }}
                  >
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Filters
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#1b3a57]">
                          Eligibility
                        </label>
                        <select
                          value={filters.eligibility}
                          onChange={(event) =>
                            update({ eligibility: event.target.value as EligibilityFilter })
                          }
                          className={cn(selectClassName(), "w-full")}
                        >
                          <option value="all">All</option>
                          <option value="eligible">In scope</option>
                          <option value="ineligible">Out of scope</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[#1b3a57]">
                          Attachments
                        </label>
                        <select
                          value={filters.attachmentFilter}
                          onChange={(event) =>
                            update({
                              attachmentFilter: event.target.value as AttachmentFilter,
                            })
                          }
                          className={cn(selectClassName(), "w-full")}
                        >
                          <option value="all">All</option>
                          <option value="with">Has attachments</option>
                          <option value="without">No attachments</option>
                        </select>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )
              : null}
          </div>

          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-slate-600 hover:text-[#1b3a57]"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={onExport}
            disabled={exporting || loading}
          >
            {exporting ? "Downloading..." : "Download CSV"}
          </Button>
          <Button
            size="sm"
            className="h-9 bg-[#1b3a57] text-white hover:bg-[#12273c]"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {filters.search.trim() ? (
            <Badge variant="outline" className="gap-1">
              Search: {filters.search.trim()}
              <button type="button" onClick={() => update({ search: "" })} aria-label="Remove search filter">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : null}
          {filters.month !== "all" ? (
            <Badge variant="outline">
              {MONTHS.find((m) => m.value === filters.month)?.label}
            </Badge>
          ) : null}
          {filters.year !== "all" ? (
            <Badge variant="outline">Year {filters.year}</Badge>
          ) : null}
          {filters.eligibility === "eligible" ? (
            <Badge variant="success">In scope</Badge>
          ) : null}
          {filters.eligibility === "ineligible" ? (
            <Badge variant="warning">Out of scope</Badge>
          ) : null}
          {filters.attachmentFilter === "with" ? (
            <Badge variant="outline">Has attachments</Badge>
          ) : null}
          {filters.attachmentFilter === "without" ? (
            <Badge variant="outline">No attachments</Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function hasDateFilters(filters: SubmissionsFilterState): boolean {
  return filters.month !== "all" || filters.year !== "all";
}

export function hasSearchFilter(filters: SubmissionsFilterState): boolean {
  return filters.search.trim() !== "";
}
