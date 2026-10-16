import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyGoogleIdToken } from "@/lib/google";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Daftar via Google (One Tap di halaman /register).
 * body: { credential } — ID token Google.
 * Membuat akun baru jika email belum terdaftar. Login menyusul dilakukan
 * client lewat signIn("credentials", { googleIdToken }).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const credential = String(body?.credential ?? "").trim();
    if (!credential) {
      return NextResponse.json(
        { ok: false, error: "credential is required" },
        { status: 400 }
      );
    }

    const email = await verifyGoogleIdToken(credential);
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Token Google tidak valid." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Email ini sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        username: makeUsername(email),
        role: isAdminEmail(email) ? "ADMIN" : "USER",
        plan: "FREE",
      },
      select: { id: true, username: true, email: true, role: true },
    });

    return NextResponse.json({ ok: true, data: { user } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { ok: false, error: "Email atau username sudah terdaftar." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}

function makeUsername(email: string): string {
  const base = email.split("@")[0].replace(/[^a-z0-9_.-]+/g, "").slice(0, 30);
  return base || "user";
}
