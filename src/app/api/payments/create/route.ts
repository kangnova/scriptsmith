import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRICE_TEXT, PRICE_VIDEO, type Tier } from "@/lib/limits";
import { createSnapTransaction } from "@/lib/payments/midtrans";

const TIER_LABEL: Record<Tier, string> = {
  TEXT: "ScriptSmith PRO — Teks saja (bulan)",
  VIDEO: "ScriptSmith PRO — Teks + Video (bulan)",
};

/**
 * Buat transaksi Snap Midtrans untuk upgrade langganan.
 * body: { tier: "TEXT" | "VIDEO" }
 * returns: { ok: true, data: { snapToken, redirectUrl, orderId } }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const tier = (body?.tier ?? "TEXT") as Tier;
    if (tier !== "TEXT" && tier !== "VIDEO") {
      return NextResponse.json(
        { ok: false, error: "tier must be TEXT or VIDEO" },
        { status: 400 }
      );
    }

    const amount = tier === "VIDEO" ? PRICE_VIDEO : PRICE_TEXT;
    // orderId wajib <= 50 karakter (aturan Midtrans). Mapping user & tier
    // sudah tersimpan di tabel Payment, jadi tidak perlu disisipkan di orderId.
    const orderId = `SS-${Date.now()}-${randomUUID().slice(0, 12)}`;

    // Simpan transaksi pending dulu — buat idempotensi + audit trail.
    await prisma.payment.create({
      data: { orderId, userId: user.id, tier, amount, status: "PENDING" },
    });

    const tx = await createSnapTransaction({
      orderId,
      amount,
      customerName: user.name ?? "ScriptSmith User",
      customerEmail: user.email ?? "",
      itemDetails: [
        { id: tier, price: amount, quantity: 1, name: TIER_LABEL[tier] },
      ],
      redirectUrl: `${process.env.NEXTAUTH_URL ?? ""}/?paid=1`,
      notificationUrl: `${process.env.NEXTAUTH_URL ?? ""}/api/payments/webhook`,
    });

    return NextResponse.json({
      ok: true,
      data: {
        snapToken: tx.token,
        redirectUrl: tx.redirect_url,
        orderId,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
