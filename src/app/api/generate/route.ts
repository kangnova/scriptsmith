import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { complete } from "@/lib/openrouter";
import {
  FREE_DAILY_LIMIT,
  canUseVideoMode,
  effectivePlan,
  jakartaStartOfDay,
} from "@/lib/limits";

const SYSTEM = `Kamu adalah copywriter konten jualan yang jago bikin konten yang
MENJUAL dan bikin orang berhenti scroll — baik video pendek (TikTok/Reels/Shorts)
maupun konten teks/carousel (Threads/Instagram). Setiap output harus SIAP PAKAI,
bukan teori. Jangan pakai code fence, dan jangan pakai markdown (bold ** atau
italic *).`;

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

function langInstruction(lang: string): {
  isEn: boolean;
  video: string;
  threads: string;
  threadsRules: string;
} {
  const isEn = lang === "en";
  if (isEn) {
    return {
      isEn,
      video: `TULIS SEMUA HASIL DALAM BAHASA INGGRIS — natural, casual, punchy selling style (mis. "grab yours before it's gone", "this is a steal"). Gunakan heading: HOOK / SCRIPT / CTA / CAPTION / MUSIC / VIDEO PROMPT.`,
      threads: `TULIS SEMUA HASIL DALAM BAHASA INGGRIS — natural, casual, punchy selling style. Gunakan heading: HOOK / THREAD / CTA / CAPTION / HASHTAGS.`,
      threadsRules: `ATURAN PENTING (WAJIB DIPATUHI, jangan dilanggar):
- Ini konten TEKS/carousel, BUKAN video. JANGAN pakai kata kerja video: "record", "watch", "TikTok/Reels feed", "scroll", "FYP". Ganti dengan bahasa slide: "swipe", "save this post", "share to story", "tap the link in bio".
- Even if the product is related to TikTok/Reels, write this Threads/carousel copy as a TEXT/slide post — not an invitation to make a video.
- HASHTAGS: JANGAN pakai #TikTok, #Reels, #Shorts, #fyp, #foryou. Pakai tagar audiens umum yang selalu relevan (mis. #SmallBusiness, #OnlineSelling) + 1-3 tagar kategori yang SESUAI dengan produk yang dijual (jangan pakai tagar kategori produk lain).`,
    };
  }
  return {
    isEn,
    video: `TULIS SEMUA HASIL DALAM BAHASA INDONESIA kasual, gaya lokal (mis. "gaskeun", "sikat", "worth it banget", "keranjang kuning"). Gunakan heading: HOOK / NASKAH / CTA / CAPTION / MUSIK / PROMPT VIDEO.`,
    threads: `TULIS SEMUA HASIL DALAM BAHASA INDONESIA kasual, gaya lokal (mis. "gaskeun", "sikat", "worth it banget"). Gunakan heading: HOOK / THREAD / CTA / CAPTION / HASHTAG.`,
    threadsRules: `ATURAN PENTING (WAJIB DIPATUHI, jangan dilanggar):
- Ini konten TEKS/carousel, BUKAN video. JANGAN pakai kata kerja video: "rekam", "tonton", "feed TikTok/Reels", "scroll video", "FYP". Ganti dengan bahasa slide: "swipe", "save postingan ini", "share ke story", "tap link di bio", "geser slide".
- Meskipun produk yang dijual berhubungan dengan TikTok/Reels, naskah Threads/carousel ini tetap ditulis sebagai POSTINGAN TEKS/slide — bukan ajakan buat bikin video.
- HASHTAG: JANGAN pakai #TikTok, #Reels, #Shorts, #fyp, #foryou. Pakai tagar audiens umum yang selalu relevan (mis. #UMKM, #JualanOnline, #BisnisOnline) + 1-3 tagar kategori yang SESUAI dengan produk yang dijual (jangan pakai tagar kategori produk lain).`,
  };
}

function linkInstruction(link: string): string {
  return link.trim()
    ? `Sertakan link produk ${link} apa adanya di dalam bagian CAPTION, dan sebut "link di bio" secara natural di CTA.`
    : `TIDAK ADA LINK — buat CTA umum (mis. "cek profil / tulis komentar") tanpa menyebut link spesifik.`;
}

/** Bersihkan hasil LLM sebelum ditampilkan: hapus code fence, markdown emphasis,
 *  dan baris meta yang bocor dari instruksi (mis. "LINK PRODUK:", "Note:"). */
function cleanOutput(text: string): string {
  return text
    .replace(/^```[a-zA-Z]*\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .replace(/^\s*[-*_]{3,}\s*\n?/, "")
    .replace(/\n?\s*[-*_]{3,}\s*$/, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(
      (l) => !/^(LINK\s*PRODUK|NOTE|CATATAN|KETERANGAN)\s*[:：]/i.test(l.trim())
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildVideoPrompt(
  product: string,
  price: string,
  category: string,
  mode: string,
  lang: string,
  link: string
): string {
  const { isEn, video: langInstr } = langInstruction(lang);
  const linkInstr = linkInstruction(link);

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

  prompt +=
    "\nFormat output: TULIS HANYA hasil konten yang diminta (HOOK sampai HASHTAG) — JANGAN tambahkan bagian Note/Catatan/penjelasan/komentar apa pun. Langsung hasil siap pakai, jangan bertele-tele.";
  return prompt;
}

function buildThreadsPrompt(
  product: string,
  price: string,
  category: string,
  lang: string,
  link: string
): string {
  const { threads: langInstr, threadsRules } = langInstruction(lang);
  const linkInstr = linkInstruction(link);

  return `
Buatkan naskah konten jualan untuk Threads & carousel Instagram (konten TEKS/slide, BUKAN video):
PRODUK: ${product}
HARGA: ${price}
KATEGORI: ${category} (gunakan ${resolveStyle(category)})
PLATFORM: Threads & Carousel Instagram (teks-forward, rasio 1:1 / 4:5, dibaca bukan ditonton)
${langInstr}
${threadsRules}

HASIL YANG WAJIB ADA (format rapi, siap copy-paste):
1. HOOK — 3 opsi baris pembuka (masing-masing maks 1 kalimat) yang bikin orang berhenti scroll dan lanjut baca.
2. THREAD/CAROUSEL — 7-9 slide singkat. Tiap slide maks 2 baris, satu ide per slide, disusun sebagai narasi jualan: Slide 1 ulang hook terkuat → masalah/pain point → manfaat utama → bukti/rasa percaya → sebut harga ${price} → bandingkan nilai → ajakan. Tulis tiap slide dengan awalan "Slide N:". Bahasanya padat dan punchy, cocok buat teks di atas gambar carousel.
3. CTA — satu kalimat penutup yang dorong langsung beli / klik link (urgency).
4. CAPTION + HASHTAG — caption pendek siap tempel (1-3 baris) untuk kolom Threads/caption IG, lalu 5-10 hashtag relevan kategori (TANPA #fyp/#foryou; pakai tagar yang dicari orang di Threads/IG). ${linkInstr}

Format output: TULIS HANYA hasil konten yang diminta (HOOK sampai HASHTAG) — JANGAN tambahkan bagian Note/Catatan/penjelasan/komentar apa pun. Langsung hasil siap pakai, jangan bertele-tele.
`;
}

function buildPrompt(
  product: string,
  price: string,
  category: string,
  mode: string,
  lang: string,
  link: string,
  format: string
): string {
  return format === "threads"
    ? buildThreadsPrompt(product, price, category, lang, link)
    : buildVideoPrompt(product, price, category, mode, lang, link);
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

    const body = await req.json();
    const { product, price, category, mode, lang, link, format } = body ?? {};

    if (!product || !price) {
      return NextResponse.json(
        { ok: false, error: "product and price are required" },
        { status: 400 }
      );
    }

    const requestedMode = String(mode ?? "text");
    const requestedFormat = String(format ?? "video");

    // Cek plan efektif (PRO kedaluwarsa = otomatis FREE).
    const plan = effectivePlan(user.plan, user.planExpiresAt);

    // Mode "video" (teks + prompt video AI) = fitur premium PRO_VIDEO.
    // Hanya berlaku untuk format video pendek; Threads/carousel tidak punya prompt video.
    if (
      requestedFormat === "video" &&
      requestedMode === "video" &&
      !canUseVideoMode(plan)
    ) {
      return NextResponse.json(
        { ok: false, error: "VIDEO_UPGRADE_REQUIRED", data: { plan } },
        { status: 402 }
      );
    }

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

    const text = await complete(
      [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: buildPrompt(
            String(product),
            String(price),
            String(category ?? ""),
            requestedMode,
            String(lang ?? "id"),
            String(link ?? ""),
            requestedFormat
          ),
        },
      ],
      { temperature: 0.9, maxTokens: 2000 }
    );

    const cleaned = cleanOutput(text);

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
