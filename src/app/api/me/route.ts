import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FREE_DAILY_LIMIT,
  PRICE_MONTHLY,
  PRICE_YEARLY,
  UPGRADE_WHATSAPP,
  PAYMENT_INFO,
  effectivePlan,
  jakartaStartOfDay,
} from "@/lib/limits";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = {
    priceMonthly: PRICE_MONTHLY,
    priceYearly: PRICE_YEARLY,
    upgradeWhatsapp: UPGRADE_WHATSAPP,
    paymentInfo: PAYMENT_INFO,
  };

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: true, data: { loggedIn: false, ...base } });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return NextResponse.json({ ok: true, data: { loggedIn: false, ...base } });
  }

  const plan = effectivePlan(user.plan, user.planExpiresAt);
  const usedToday = await prisma.generation.count({
    where: { userId: user.id, createdAt: { gte: jakartaStartOfDay() } },
  });

  return NextResponse.json({
    ok: true,
    data: {
      loggedIn: true,
      email: user.email,
      role: user.role,
      plan,
      planExpiresAt: user.planExpiresAt ? user.planExpiresAt.toISOString() : null,
      usedToday,
      dailyLimit: FREE_DAILY_LIMIT,
      remainingToday: Math.max(0, FREE_DAILY_LIMIT - usedToday),
      ...base,
    },
  });
}
