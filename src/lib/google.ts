/**
 * Verifikasi ID token Google (dipakai untuk Google One Tap / daftar-google).
 * Memakai endpoint tokeninfo resmi Google supaya tanpa dependency tambahan.
 * Returns email (lowercase) jika token valid & email terverifikasi, atau null.
 */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        idToken
      )}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      email?: string;
      email_verified?: string | boolean;
      aud?: string;
    };

    const email = data.email?.toLowerCase();
    if (!email) return null;

    // Pastikan token dibuat untuk client-id aplikasi ini (cegah pemakaian
    // token dari aplikasi lain).
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && data.aud && data.aud !== clientId) return null;

    const verified = data.email_verified;
    if (verified !== undefined && verified !== true && verified !== "true") {
      return null;
    }

    return email;
  } catch {
    return null;
  }
}
