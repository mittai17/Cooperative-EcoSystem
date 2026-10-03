import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [10, 20, 50];

interface PagerProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

function visiblePages(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (page > 3) pages.push("…");
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (page < pageCount - 2) pages.push("…");
  pages.push(pageCount);
  return pages;
}

export function Pager({ page, pageCount, total, pageSize, onPage, onPageSize }: PagerProps) {
  const safeCount = Math.max(1, pageCount);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  const navBtn =
    "inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing {first}–{last} of {total}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={navBtn} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        {visiblePages(page, safeCount).map((item, index) =>
          item === "…" ? (
            <span key={`gap-${index}`} className="px-1">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md border text-sm",
                item === page
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent hover:bg-muted text-foreground",
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          className={navBtn}
          onClick={() => onPage(page + 1)}
          disabled={page >= safeCount}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        <select
          aria-label="Rows per page"
          value={pageSize}
          onChange={(event) => onPageSize(Number(event.target.value))}
          className="ml-2 h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
