import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/payments/midtrans";
import { PRO_DAYS, tierToPlan, type Tier } from "@/lib/limits";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Webhook Midtrans: dipanggil Midtrans saat status pembayaran berubah.
 * Verifikasi signature -> kalau sukses, aktifkan PRO sesuai tier.
 * Idempoten: tiap order_id hanya diproses sukses sekali (status SETTLED).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }

    const isValid = verifySignature(
      String(order_id),
      String(status_code),
      String(gross_amount),
      String(signature_key)
    );
    if (!isValid) {
      return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { orderId: String(order_id) },
    });
    if (!payment) {
      return NextResponse.json({ ok: false, error: "order not found" }, { status: 400 });
    }

    const isSuccess =
      transaction_status === "capture" ||
      transaction_status === "settlement" ||
      (transaction_status === "pending" && fraud_status === "accept");

    if (isSuccess && payment.status !== "SETTLED") {
      const plan = tierToPlan(payment.tier as Tier);

      // Perpanjang dari tanggal kedaluwarsa yang masih aktif (bukan reset dari sekarang).
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { planExpiresAt: true },
      });
      const base =
        user?.planExpiresAt && user.planExpiresAt.getTime() > Date.now()
          ? user.planExpiresAt
          : new Date();
      const planExpiresAt = new Date(base.getTime() + PRO_DAYS * DAY_MS);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: payment.userId },
          data: { plan, planExpiresAt },
        }),
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "SETTLED", settledAt: new Date() },
        }),
      ]);
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      await prisma.payment
        .update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        })
        .catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
