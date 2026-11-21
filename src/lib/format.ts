export const TZ = "Asia/Jakarta";
export const LOCALE = "id-ID";

export function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

export function formatDateTime(value: string | Date | null | undefined) {
  return formatDate(value, true) + (value ? " WIB" : "");
}

/** Kunci tanggal YYYY-MM-DD menurut zona Asia/Jakarta. */
export function jakartaDayKey(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** True when `iso` falls within [from, to] (inclusive, YYYY-MM-DD in Asia/Jakarta). Empty bounds are open. */
export function inDateRange(iso: string | null | undefined, from: string, to: string) {
  if (!from && !to) return true;
  if (!iso) return false;
  const k = jakartaDayKey(iso);
  return (!from || k >= from) && (!to || k <= to);
}

export function lastNDays(n: number) {
  const out: { key: string; label: string }[] = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    out.push({
      key: jakartaDayKey(d),
      label: new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: "short", day: "numeric" }).format(d),
    });
  }
  return out;
}

export function formatScore(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(Number(n));
}

export function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const LEVELS = ["SD", "SMP", "SMA"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABEL: Record<Level, string> = {
  SD: "Sekolah Dasar",
  SMP: "Sekolah Menengah Pertama",
  SMA: "Sekolah Menengah Atas",
};

export const DIFFICULTY_LABEL: Record<string, string> = { mudah: "Mudah", sedang: "Sedang", sulit: "Sulit" };

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "\uFEFF" + [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function errorMessage(e: unknown, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    const m = (e as { message: string }).message;
    if (m.includes("Invalid login credentials")) return "Nama pengguna/email atau kata sandi salah.";
    if (m.includes("banned")) return "Akun Anda sedang dinonaktifkan. Hubungi pendamping yayasan.";
    return m;
  }
  return fallback;
}

/** Siswa masuk dengan nama pengguna; dipetakan ke email internal (tidak pernah dikirimi email). */
export const STUDENT_EMAIL_DOMAIN = "akun.tangankasih.local";
export function loginIdentifierToEmail(identifier: string) {
  const v = identifier.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${STUDENT_EMAIL_DOMAIN}`;
}
export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
