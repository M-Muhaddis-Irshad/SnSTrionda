"use client";

// =============================================================================
// ShopPagination — real pagination driven by the ?page= URL param
// =============================================================================

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function ShopPagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p <= 1) params.delete("page");
    else params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        className="border border-chrome-500 px-4 py-2 font-body text-xs uppercase tracking-wider text-muted transition-colors hover:border-chrome-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        Prev
      </button>

      {start > 1 && <span className="px-2 font-body text-sm text-chrome-400">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => goTo(p)}
          aria-current={p === page ? "page" : undefined}
          className={`h-9 w-9 border font-body text-sm transition-colors ${
            p === page
              ? "border-foreground bg-foreground text-background"
              : "border-chrome-500 text-muted hover:border-chrome-300 hover:text-foreground"
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && <span className="px-2 font-body text-sm text-chrome-400">…</span>}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        className="border border-chrome-500 px-4 py-2 font-body text-xs uppercase tracking-wider text-muted transition-colors hover:border-chrome-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>

      <span className="ml-4 font-body text-xs text-chrome-400">
        {total} item{total !== 1 ? "s" : ""}
      </span>
    </nav>
  );
}