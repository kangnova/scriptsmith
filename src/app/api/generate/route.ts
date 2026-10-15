import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { complete } from "@/lib/openrouter";
import {
  FREE_DAILY_LIMIT,
  effectivePlan,
  jakartaStartOfDay,
} from "@/lib/limits";

const SYSTEM = `Kamu adalah copywriter konten jualan yang jago bikin video pendek
TikTok/Reels/Shorts yang MENJUAL dan bikin orang berhenti scroll. Setiap output
harus SIAP PAKAI, bukan teori. Jangan pakai code fence.`;

function resolveStyle(category: string): string {
  const c = category.toLowerCase();
  const rules: Array<[string[], string]> = [
    [["skincare", "beauty", "kosmetik", "makeup", "kulit"], "bahasa glowing, jerawat, kulit, review jujur, before-after"],
    [["fashion", "baju", "outfit", "pakaian", "style", "sepatu", "tas"], "bahasa outfit, style, bahan, model, OOTD"],
    [["food", "makanan", "kuliner", "minuman", "kopi", "cemilan", "snack"], "bahasa selera, rasa, tekstur, laperan, nyobain"],
    [["elektronik", "electronics", "gadget", "hp", "spek", "alat", "earbuds", "headphone", "speaker", "charger", "kabel", "powerbank", "laptop", "mouse", "keyboard"], "bahasa fitur, spek, worth it, harga vs kualitas"],
    [["mainan", "toys", "anak"], "bahasa anak, orang tua, edukatif, seru, mainan"],
    [["olahraga", "sport", "fitness", "gym"], "bahasa semangat, performa, sehat, hasil latihan"],
    [["rumah", "household", "dapur", "perabot", "home"], "bahasa praktis, rapi, hemat, rumah"],
    [["kesehatan", "health", "vitamin", "supplement", "sehat"], "bahasa sehat, stamina, efek, testimoni"],
    [["aksesoris", "accessories", "gelang", "kalung", "jam"], "bahasa tampilan, gaya, detail, bahan"],
    [["jasa", "service", "layanan", "laundry"], "bahasa hasil, kemudahan, hemat waktu, dipercaya"],
  ];
  for (const [keys, style] of rules) {
    if (keys.some((k) => c.includes(k))) return style;
  }
  return `bahasa jualan yang natural dan spesifik untuk kategori "${category}" — ciptakan sendiri istilah, emosi, dan pain point khas pembeli kategori ini`;
}

function buildPrompt(
  product: string,
  price: string,
  category: string,
  mode: string,
  lang: string,
  link: string
): string {
  const isEn = lang === "en";
  const langInstr = isEn
    ? `TULIS SEMUA HASIL DALAM BAHASA INGGRIS — natural, casual, punchy selling style (mis. "grab yours before it's gone", "this is a steal"). Gunakan heading: HOOK / SCRIPT / CTA / CAPTION / MUSIC / VIDEO PROMPT.`
    : `TULIS SEMUA HASIL DALAM BAHASA INDONESIA kasual, gaya lokal (mis. "gaskeun", "sikat", "worth it banget", "keranjang kuning"). Gunakan heading: HOOK / NASKAH / CTA / CAPTION / MUSIK / PROMPT VIDEO.`;

  const linkInstr = link.trim()
    ? `LINK PRODUK: ${link}. Sertakan link ini apa adanya di bagian CAPTION, dan sebut "link di bio" secara natural di CTA.`
    : `TIDAK ADA LINK — buat CTA umum (mis. "cek profil / tulis komentar") tanpa menyebut link spesifik.`;

  let prompt = `
Buatkan naskah konten jualan video pendek untuk:
PRODUK: ${product}
HARGA: ${price}
KATEGORI: ${category} (gunakan ${resolveStyle(category)})
PLATFORM: TikTok / Reels / Shorts (rasio 9:16, durasi 15-45 detik)
${langInstr}

HASIL YANG WAJIB ADA (format rapi, siap copy-paste):
1. HOOK — 3 opsi pembuka (masing-masing maks 1 kalimat) yang bikin berhenti scroll.
2. NASKAH/SCRIPT — naskah lisan lengkap (bukan poin), durasi 15-45 detik, bahasa ngomong natural, nyeritain manfaat + bukti + sebut harga ${price} apa adanya, menyentuh rasa FOMO/butuh.
3. CTA — penutup kuat yang dorong langsung beli / klik link (urgency).
4. CAPTION + HASHTAG — caption pendek siap tempel (1-3 baris) untuk kolom caption video, lalu 5-10 hashtag/tagar relevan yang lagi populer (campur tagar luas + spesifik + tren platform seperti #fyp #foryou) supaya konten gampang ditemukan orang. ${linkInstr}
5. MUSIK/MUSIC — sebut VIBE yang cocok (mis. upbeat, chill, hype), KENAPA cocok sama produk ini, dan 2-3 contoh JENIS audio/sound yang lagi tren di TikTok (bukan judul lagu mati).
`;

  if (mode === "video") {
    if (isEn) {
      prompt += `
6. VIDEO PROMPT — satu prompt siap copy-paste untuk generator video AI (Kling/Vidu/Runway/Pika), dalam bahasa Inggris: deskripsi adegan per beberapa detik, gaya visual, gerakan kamera, pencahayaan, warna/mood, rasio 9:16, tanpa watermark.
`;
    } else {
      prompt += `
6. PROMPT VIDEO AI — SATU prompt siap copy-paste untuk generator video AI (Kling/Vidu/Runway/Pika). Isi: deskripsi adegan per beberapa detik, gaya visual, gerakan kamera, pencahayaan, warna/mood, rasio 9:16, tanpa watermark. Prompt ditulis dalam bahasa Inggris (lebih optimal untuk video AI), lalu di bawahnya terjemahan singkat bahasa Indonesia biar user paham.
`;
    }
  }

  prompt += "\nFormat output: langsung hasil siap pakai, jangan bertele-tele.";
  return prompt;
}

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

    // Cek plan efektif (PRO kedaluwarsa = otomatis FREE).
    const plan = effectivePlan(user.plan, user.planExpiresAt);
    if (plan === "FREE") {
      const today = jakartaStartOfDay();
      const used = await prisma.generation.count({
        where: { userId: user.id, createdAt: { gte: today } },
      });
      if (used >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            ok: false,
            error: "QUOTA_EXCEEDED",
            data: { used, limit: FREE_DAILY_LIMIT },
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const { product, price, category, mode, lang, link } = body ?? {};

    if (!product || !price) {
      return NextResponse.json(
        { ok: false, error: "product and price are required" },
        { status: 400 }
      );
    }

    const text = await complete(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: buildPrompt(
            String(product),
            String(price),
            String(category ?? ""),
            String(mode ?? "text"),
            String(lang ?? "id"),
            String(link ?? "")
          ),
        },
      ],
      { temperature: 0.9, maxTokens: 2000 }
    );

    const cleaned = text
      .replace(/^```[a-zA-Z]*\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .replace(/^\s*[-*_]{3,}\s*\n?/, "")
      .replace(/\n?\s*[-*_]{3,}\s*$/, "")
      .trim();

    // Catat pemakaian (buat hitung kuota harian free).
    await prisma.generation.create({ data: { userId: user.id } });

    return NextResponse.json({ ok: true, data: { text: cleaned } });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
