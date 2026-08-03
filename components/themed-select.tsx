"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type ThemedSelectOption = { value: string; label: string };

type DropdownPanelProps = {
  open: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
  className?: string;
};

function DropdownPanel({ open, anchorRef, children, className }: DropdownPanelProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.top - 8,
      left: rect.left,
      width: rect.width,
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed z-[9999] -translate-y-full overflow-hidden rounded-2xl border border-gray-200 bg-white",
        "shadow-[0_16px_40px_rgba(27,58,87,0.18)]",
        className,
      )}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

type ThemedSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: ThemedSelectOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  "aria-label"?: string;
};

export function ThemedSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  searchable,
  "aria-label": ariaLabel,
}: ThemedSelectProps) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const showSearch = searchable ?? options.length > 8;
  const selectedLabel = options.find((o) => o.value === value)?.label;

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        (e.target as Element).closest?.("[data-themed-select-panel]")
      ) {
        return;
      }
      setOpen(false);
      setSearch("");
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSelect = (next: string) => {
    onChange(next);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-5 py-3 text-left text-sm font-medium shadow-sm transition-all",
          "border-gray-200 text-gray-700",
          "hover:border-[#00AEEF]/60 hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEEF] focus-visible:ring-offset-2",
          open && "border-[#00AEEF] shadow-[0_8px_24px_rgba(0,174,239,0.12)]",
          value && "border-[#00AEEF]/40",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            value ? "font-semibold text-[#1b3a57]" : "font-normal text-gray-400",
          )}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[#00AEEF] transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <DropdownPanel open={open} anchorRef={triggerRef}>
        <div data-themed-select-panel>
          {showSearch && (
            <div className="border-b border-gray-100 bg-[#f8fbfd] p-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00AEEF]"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search countries..."
                  className="h-10 rounded-xl border-gray-200 bg-white pl-9 text-sm focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                  autoFocus
                />
              </div>
            </div>
          )}

          <ul id={listboxId} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm text-gray-500">
                No countries found
              </li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                return (
                  <li key={option.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                        "text-gray-700 hover:bg-[#e6f5fc]",
                        isSelected &&
                          "bg-gradient-to-r from-[#00AEEF]/10 to-[#0091cf]/10 font-semibold text-[#1b3a57]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isSelected
                            ? "border-[#00AEEF] bg-[#00AEEF]"
                            : "border-gray-300 bg-white",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3 w-3 text-white",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </span>
                      <span className="flex-1">{option.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </DropdownPanel>
    </div>
  );
}

type ThemedMultiSelectProps = {
  values: string[];
  onChange: (values: string[]) => void;
  options: ThemedSelectOption[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  "aria-label"?: string;
};

export function ThemedMultiSelect({
  values,
  onChange,
  options,
  placeholder = "Select countries...",
  className,
  searchable,
  "aria-label": ariaLabel,
}: ThemedMultiSelectProps) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const showSearch = searchable ?? options.length > 8;
  const selectedSet = useMemo(() => new Set(values), [values]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, search]);

  const triggerLabel = useMemo(() => {
    if (values.length === 0) return null;
    if (values.length === 1) return values[0];
    if (values.length === 2) return values.join(", ");
    return `${values.length} countries selected`;
  }, [values]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        (e.target as Element).closest?.("[data-themed-select-panel]")
      ) {
        return;
      }
      setOpen(false);
      setSearch("");
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggleValue = (country: string) => {
    const next = new Set(values);
    if (next.has(country)) {
      next.delete(country);
    } else {
      next.add(country);
    }
    onChange(Array.from(next).sort((a, b) => a.localeCompare(b)));
  };

  const removeValue = (country: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== country));
  };

  return (
    <div ref={rootRef} className={cn("relative w-full space-y-2", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-white px-5 py-3 text-left text-sm font-medium shadow-sm transition-all",
          "border-gray-200 text-gray-700",
          "hover:border-[#00AEEF]/60 hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEEF] focus-visible:ring-offset-2",
          open && "border-[#00AEEF] shadow-[0_8px_24px_rgba(0,174,239,0.12)]",
          values.length > 0 && "border-[#00AEEF]/40",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1",
            triggerLabel ? "font-semibold text-[#1b3a57]" : "font-normal text-gray-400",
          )}
        >
          {triggerLabel ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[#00AEEF] transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((country) => (
            <span
              key={country}
              className="inline-flex items-center gap-1 rounded-full border border-[#00AEEF]/30 bg-[#e6f5fc] px-3 py-1 text-xs font-semibold text-[#1b3a57]"
            >
              {country}
              <button
                type="button"
                onClick={(e) => removeValue(country, e)}
                className="rounded-full p-0.5 text-[#00AEEF] hover:bg-[#00AEEF]/10"
                aria-label={`Remove ${country}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <DropdownPanel open={open} anchorRef={triggerRef}>
        <div data-themed-select-panel>
          {showSearch && (
            <div className="border-b border-gray-100 bg-[#f8fbfd] p-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00AEEF]"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search countries..."
                  className="h-10 rounded-xl border-gray-200 bg-white pl-9 text-sm focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                  autoFocus
                />
              </div>
            </div>
          )}

          {values.length > 0 && (
            <div className="border-b border-gray-100 px-4 py-2 text-xs font-medium text-[#00AEEF]">
              {values.length} selected — tap to add or remove
            </div>
          )}

          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm text-gray-500">
                No countries found
              </li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedSet.has(option.value);
                return (
                  <li key={option.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => toggleValue(option.value)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                        "text-gray-700 hover:bg-[#e6f5fc]",
                        isSelected &&
                          "bg-gradient-to-r from-[#00AEEF]/10 to-[#0091cf]/10 font-semibold text-[#1b3a57]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                          isSelected
                            ? "border-[#00AEEF] bg-[#00AEEF]"
                            : "border-gray-300 bg-white",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3 w-3 text-white",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </span>
                      <span className="flex-1">{option.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch("");
              }}
              className="h-10 w-full rounded-xl bg-gradient-to-r from-[#00AEEF] to-[#0091cf] text-sm font-semibold text-white shadow-sm hover:shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      </DropdownPanel>
    </div>
  );
}
