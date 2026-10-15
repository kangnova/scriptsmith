import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRO_MONTHLY_DAYS, PRO_YEARLY_DAYS } from "@/lib/limits";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Admin-only: setel plan user.
 * body: { userId, action: "monthly" | "yearly" | "free" }
 *   monthly -> PRO 30 hari, yearly -> PRO 365 hari, free -> FREE.
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
      return NextResponse.json(
        { ok: false, error: "userId is required" },
        { status: 400 }
      );
    }

    let plan: string;
    let planExpiresAt: Date | null;
    if (action === "monthly") {
      plan = "PRO";
      planExpiresAt = new Date(Date.now() + PRO_MONTHLY_DAYS * DAY_MS);
    } else if (action === "yearly") {
      plan = "PRO";
      planExpiresAt = new Date(Date.now() + PRO_YEARLY_DAYS * DAY_MS);
    } else if (action === "free") {
      plan = "FREE";
      planExpiresAt = null;
    } else {
      return NextResponse.json(
        { ok: false, error: "action must be monthly, yearly, or free" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { plan, planExpiresAt },
      select: { id: true, email: true, plan: true, planExpiresAt: true },
    });

    return NextResponse.json({ ok: true, data: { user } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
