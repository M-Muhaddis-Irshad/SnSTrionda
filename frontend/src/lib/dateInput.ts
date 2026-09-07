// =============================================================================
// Date helpers — <input type="datetime-local"> round-trip + display
// =============================================================================

// ISO string (from the API) → value for an <input type="datetime-local">
export function toDateTimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// datetime-local input value → ISO string (or null when cleared/invalid)
export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// Short readable date, e.g. "12 Sep 2026"
export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isPast(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}
