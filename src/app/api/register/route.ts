import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const username = String(body?.username ?? "").trim().toLowerCase();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Username harus 3-30 karakter (huruf kecil, angka, titik, garis bawah atau strip).",
        },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Alamat email tidak valid." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username } }),
    ]);
    if (existingEmail) {
      return NextResponse.json(
        { ok: false, error: "Email ini sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }
    if (existingUsername) {
      return NextResponse.json(
        { ok: false, error: "Username sudah dipakai. Coba yang lain." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        name: name || username,
        passwordHash: hashPassword(password),
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
