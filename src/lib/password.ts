import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Hash password pakai scrypt (bawaan Node, tanpa dependency tambahan).
 * Format tersimpan: "<salt_hex>:<hash_hex>".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Bandingkan password plaintext dengan hash tersimpan (aman timing attack). */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const calc = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return calc.length === expected.length && timingSafeEqual(calc, expected);
  } catch {
    return false;
  }
}
