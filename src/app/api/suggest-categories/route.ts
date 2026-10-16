import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { complete } from "@/lib/openrouter";

const SYSTEM = `Kamu adalah asisten yang jago mengklasifikasi produk e-commerce.
Tugasmu memberi saran kategori jualan yang spesifik untuk konten jualan
(video pendek TikTok/Reels/Shorts & Threads/carousel). Kembalikan HANYA array
JSON berisi 5-8 string kategori
pendek (maks 3 kata per kategori). Tanpa teks lain, tanpa penjelasan, tanpa
code fence.`;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { product, lang } = body ?? {};

    if (!product || String(product).trim().length < 3) {
      return NextResponse.json(
        { ok: false, error: "product name is too short" },
        { status: 400 }
      );
    }

    const isEn = lang === "en";
    const langInstr = isEn
      ? "Nama kategori dalam bahasa Inggris."
      : "Nama kategori dalam bahasa Indonesia (boleh campur istilah umum seperti 'Skincare').";

    const text = await complete(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Produk: ${product}\n${langInstr}\nBeri 5-8 saran kategori yang spesifik dan menjual.`,
        },
      ],
      { temperature: 0.4, maxTokens: 200 }
    );

    let categories: string[] = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        categories = parsed.map(String).slice(0, 10);
      }
    } catch {
      categories = text
        .split(/\n|,|\d+\./)
        .map((s) => s.trim().replace(/^["\[\]]+|["\[\]]+$/g, ""))
        .filter((s) => s.length > 1)
        .slice(0, 10);
    }

    return NextResponse.json({ ok: true, data: { categories } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
