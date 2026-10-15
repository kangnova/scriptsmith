/**
 * Konfigurasi batasan free/pro dan harga. Semua bisa di-override lewat env
 * (.env.local) supaya gampang diubah tanpa ngoding.
 */

export type Plan = "FREE" | "PRO";

export const PLAN = {
  FREE: "FREE",
  PRO: "PRO",
} as const;

/** Berapa naskah gratis per hari untuk user FREE. */
export const FREE_DAILY_LIMIT = intEnv("FREE_DAILY_LIMIT", 2);

/** Harga dalam Rupiah (hanya untuk tampilan; pembayaran manual). */
export const PRICE_MONTHLY = intEnv("PRICE_MONTHLY", 49000);
export const PRICE_YEARLY = intEnv("PRICE_YEARLY", 399000);

/** Durasi akses PRO untuk pembayaran bulanan/tahunan (dalam hari). */
export const PRO_MONTHLY_DAYS = intEnv("PRO_MONTHLY_DAYS", 30);
export const PRO_YEARLY_DAYS = intEnv("PRO_YEARLY_DAYS", 365);

/** Kontak untuk konfirmasi pembayaran manual (WhatsApp + nama/akun tujuan). */
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

/** Plan efektif: PRO dianggap FREE kalau sudah kedaluwarsa. */
export function effectivePlan(plan: string, planExpiresAt: Date | null): Plan {
  if (plan !== PLAN.PRO) return PLAN.FREE;
  if (planExpiresAt && planExpiresAt.getTime() <= Date.now()) return PLAN.FREE;
  return PLAN.PRO;
}
