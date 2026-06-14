"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pagination ringan untuk list client-side.
 * `page` berbasis 0. Tidak dirender bila hanya ada satu halaman.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  className,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-1 pt-1",
        className,
      )}
    >
      <p className="text-xs text-ink-mute">
        Halaman <span className="font-medium text-ink-soft">{page + 1}</span>{" "}
        dari <span className="font-medium text-ink-soft">{pageCount}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <PageButton
          label="Halaman sebelumnya"
          disabled={page <= 0}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>
        <PageButton
          label="Halaman berikutnya"
          disabled={page >= pageCount - 1}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-paper text-ink-soft transition-colors hover:border-amber hover:text-amber-dk disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
