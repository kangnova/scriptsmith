import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Admin-only: kelola akun.
 * body: { userId, action: "edit" | "delete" | "resetPassword", ... }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = body ?? {};
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (action === "delete") {
      if (target.role === "ADMIN" && target.id === admin.id) {
        return NextResponse.json(
          { ok: false, error: "Tidak bisa menghapus akun sendiri." },
          { status: 400 }
        );
      }
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ ok: true });
    }

    if (action === "edit") {
      const name = String(body?.name ?? "").trim();
      const username = String(body?.username ?? "").trim().toLowerCase();
      const email = String(body?.email ?? "").trim().toLowerCase();
      const role = body?.role === "ADMIN" ? "ADMIN" : "USER";

      if (!USERNAME_RE.test(username)) {
        return NextResponse.json(
          { ok: false, error: "Username tidak valid (3-30 karakter)." },
          { status: 400 }
        );
      }
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ ok: false, error: "Email tidak valid." }, { status: 400 });
      }

      const [emailTaken, userTaken] = await Promise.all([
        prisma.user.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { username } }),
      ]);
      if (emailTaken && emailTaken.id !== userId) {
        return NextResponse.json(
          { ok: false, error: "Email sudah dipakai akun lain." },
          { status: 409 }
        );
      }
      if (userTaken && userTaken.id !== userId) {
        return NextResponse.json(
          { ok: false, error: "Username sudah dipakai akun lain." },
          { status: 409 }
        );
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { name: name || null, username, email, role },
        select: { id: true, name: true, username: true, email: true, role: true },
      });
      return NextResponse.json({ ok: true, data: { user } });
    }

    if (action === "resetPassword") {
      const password = String(body?.password ?? "");
      if (password.length < 6) {
        return NextResponse.json(
          { ok: false, error: "Password minimal 6 karakter." },
          { status: 400 }
        );
      }
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashPassword(password) },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, error: "action must be edit, delete, or resetPassword" },
      { status: 400 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { ok: false, error: "Email atau username sudah dipakai." },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
