import crypto from "crypto";

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

const SNAP_URL = isProduction
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export interface CreateTransactionParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  itemDetails: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  redirectUrl?: string;
  notificationUrl?: string;
}

/**
 * Format start_time yang diminta Midtrans: "yyyy-MM-dd hh:mm:ss +0700"
 * (zona WIB / Asia-Jakarta). Server mungkin berjalan di UTC, jadi digeser
 * manual ke +7 supaya nilainya selalu benar.
 */
function midtransStartTime(): string {
  const shifted = new Date(Date.now() + 7 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${shifted.getUTCFullYear()}-${p(shifted.getUTCMonth() + 1)}-${p(shifted.getUTCDate())}` +
    ` ${p(shifted.getUTCHours())}:${p(shifted.getUTCMinutes())}:${p(shifted.getUTCSeconds())}` +
    ` +0700`
  );
}

/**
 * Buat transaksi Snap Midtrans (pakai fetch langsung supaya bisa kirim header
 * X-Override-Notification — alamat webhook dikirim per transaksi, jadi tidak
 * wajib setel "Payment Notification URL" di dashboard).
 */
export async function createSnapTransaction(params: CreateTransactionParams) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const auth = Buffer.from(`${serverKey}:`).toString("base64");

  const transactionParams: Record<string, unknown> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    item_details: params.itemDetails,
    callbacks: {
      finish: params.redirectUrl,
    },
    expiry: {
      start_time: midtransStartTime(),
      unit: "hours",
      duration: 24,
    },
  };

  const headers: Record<string, string> = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (params.notificationUrl) {
    headers["X-Override-Notification"] = params.notificationUrl;
  }

  const res = await fetch(SNAP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(transactionParams),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error_messages) {
    const msg = Array.isArray(data.error_messages)
      ? data.error_messages.join(", ")
      : data.error_message || `Midtrans ${res.status}`;
    throw new Error(msg);
  }

  return {
    token: data.token as string,
    redirect_url: data.redirect_url as string,
  };
}

export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const input = `${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`;
  const hash = crypto.createHash("sha512").update(input).digest("hex");
  return hash === signatureKey;
}
