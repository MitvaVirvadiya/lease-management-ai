export function inr(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatField(value: string | null, type: string): string {
  if (value == null || value === "") return "—";
  if (type === "money") return inr(Number(value));
  if (type === "date") return formatDate(value);
  if (type === "boolean") return value === "true" ? "Yes" : "No";
  if (type === "percent") return `${value}%`;
  if (type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? new Intl.NumberFormat("en-IN").format(n) : value;
  }
  return value;
}
