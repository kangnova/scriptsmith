/**
 * Konfigurasi batasan free/pro dan harga. Semua bisa di-override lewat env
 * (.env.local) supaya gampang diubah tanpa ngoding.
 */

export type Plan = "FREE" | "PRO_TEXT" | "PRO_VIDEO";
export type Tier = "TEXT" | "VIDEO";

export const PLAN = {
  FREE: "FREE",
  PRO_TEXT: "PRO_TEXT",
  PRO_VIDEO: "PRO_VIDEO",
} as const;

/** Berapa naskah gratis per hari untuk user FREE. */
export const FREE_DAILY_LIMIT = intEnv("FREE_DAILY_LIMIT", 2);

/**
 * Harga langganan (Rupiah, per bulan).
 * PRO_TEXT  = mode hasil "Teks saja".
 * PRO_VIDEO = mode hasil "Teks + prompt video AI".
 */
export const PRICE_TEXT = intEnv("PRICE_TEXT", 49000);
export const PRICE_VIDEO = intEnv("PRICE_VIDEO", 75000);

/** Durasi akses PRO per pembayaran (dalam hari). */
export const PRO_DAYS = intEnv("PRO_DAYS", 30);

/** Midtrans client key (Snap) — aman diekspos ke browser. */
export const MIDTRANS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";

/** Kontak untuk pembayaran manual (fallback; opsional). */
export const UPGRADE_WHATSAPP = process.env.UPGRADE_WHATSAPP ?? "";
export const PAYMENT_INFO = process.env.PAYMENT_INFO ?? "";

function intEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Awal hari ini dalam zona Asia/Jakarta (UTC+07:00). Dipakai buat hitung
 * kuota harian supaya "hari" mengikuti waktu Indonesia, bukan UTC server.
 */
export function jakartaStartOfDay(now: Date = new Date()): Date {
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // "YYYY-MM-DD"
  return new Date(`${dateStr}T00:00:00+07:00`);
}

/**
 * Plan efektif: PRO (text/video) dianggap FREE kalau sudah kedaluwarsa.
 * Plan lama "PRO" (legacy, akses penuh) dianggap PRO_VIDEO.
 */
export function effectivePlan(plan: string, planExpiresAt: Date | null): Plan {
  const isPro =
    plan === PLAN.PRO_TEXT || plan === PLAN.PRO_VIDEO || plan === "PRO";
  if (!isPro) return PLAN.FREE;
  if (planExpiresAt && planExpiresAt.getTime() <= Date.now()) return PLAN.FREE;
  return plan === PLAN.PRO_TEXT ? PLAN.PRO_TEXT : PLAN.PRO_VIDEO;
}

/** Apakah plan (efektif) termasuk PRO (sudah bayar). */
export function isProPlan(plan: Plan): boolean {
  return plan === PLAN.PRO_TEXT || plan === PLAN.PRO_VIDEO;
}

/** Apakah plan boleh pakai mode hasil "video" (teks + prompt video AI). */
export function canUseVideoMode(plan: Plan): boolean {
  return plan === PLAN.PRO_VIDEO;
}

/** Map tier pembayaran -> plan yang diaktifkan. */
export function tierToPlan(tier: Tier): Plan {
  return tier === "VIDEO" ? PLAN.PRO_VIDEO : PLAN.PRO_TEXT;
}
