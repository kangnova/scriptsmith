#!/usr/bin/env python3
"""Generator naskah konten jualan (MVP) - panggil OpenRouter.

Pemakaian:
  python3 gen.py "Nama Produk" kategori [teks|video]

Contoh:
  python3 gen.py "Serum Glow Whitening" skincare video
"""
import json
import os
import sys
import urllib.request

# ---- Cari API key dari file .env (auto-detect, jangan hardcode) ----
ENV_PATHS = [
    "/home/ubuntu/.hermes/.env",
    "/home/ubuntu/hermes-core/.env",
    "/home/ubuntu/.env",
    "/home/ubuntu/hermes-core/bot-code/.env",
]

def load_key():
    for p in ENV_PATHS:
        if os.path.isfile(p):
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("OPENROUTER_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
    return None

SYSTEM = (
    "Kamu adalah copywriter konten jualan Indonesia yang paham banget "
    "cara bikin video pendek TikTok/Reels/Shorts yang MENJUAL dan bikin "
    "orang berhenti scroll. Bahasa Indonesia kasual, natural, bukan kaku. "
    "Gunakan gaya bahasa lokal yang beneran dipakai penjual (mis. 'gaskeun', "
    "'sikat', 'worth it banget', 'keranjang kuning'). TIDAK boleh pakai bahasa "
    "marketing-asing yang kaku. Setiap output harus SIAP PAKAI, bukan teori."
)

def build_user_input(product, category, mode):
    cat_style = {
        "skincare": "bahasa glowing, jerawat, kulit, review jujur, before-after",
        "fashion": "bahasa outfit, style, bahan, model, OOTD",
        "makanan": "bahasa selera, rasa, tekstur, laparan, nyobain",
        "elektronik": "bahasa fitur, spek, worth it, harga vs kualitas",
        "umum": "bahasa jualan general",
    }.get(category, "bahasa jualan general")

    base = f"""
Buatkan naskah konten jualan video pendek untuk:
PRODUK: {product}
KATEGORI: {category} (gunakan {cat_style})
PLATFORM: TikTok / Reels / Shorts (rasio 9:16, durasi 15-45 detik)

HASIL YANG WAJIB ADA (format rapi, siap copy-paste):
1. HOOK — 3 opsi pembuka (masing-masing maks 1 kalimat) yang bikin berhenti scroll.
2. NASKAH BODY — naskah lisan lengkap (bukan poin), durasi 15-45 detik, bahasa ngomong natural, nyeritain manfaat + bukti + harga, menyentuh rasa FOMO/butuh.
3. CTA — penutup kuat yang dorong langsung beli / klik link (urgency).
4. REKOMENDASI MUSIK — sebut VIBE yang cocok (mis. upbeat, chill, hype), KENAPA cocok sama produk ini, dan 2-3 contoh JENIS audio/sound yang lagi tren di TikTok (bukan judul lagu mati).
"""
    if mode == "video":
        base += """
5. PROMPT VIDEO AI — SATU prompt siap copy-paste untuk generator video AI (Kling/Vidu/Runway/Pika). Isi: deskripsi adegan per beberapa detik secara berurutan, gaya visual, gerakan kamera, pencahayaan, warna/mood, rasio 9:16, tanpa watermark. Prompt ditulis dalam bahasa Inggris (lebih optimal untuk video AI), lalu di bawahnya terjemahan singkat bahasa Indonesia biar user paham.
"""
    base += "\nFormat output: pakai heading jelas (HOOK / NASKAH / CTA / MUSIK / PROMPT VIDEO). Jangan bertele-tele, langsung hasil siap pakai."
    return base


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    product = sys.argv[1]
    category = sys.argv[2].lower()
    mode = sys.argv[3].lower() if len(sys.argv) > 3 else "teks"
    if mode not in ("teks", "video"):
        mode = "teks"

    key = load_key()
    if not key:
        print("ERROR: OPENROUTER_API_KEY tidak ditemukan di file .env manapun.")
        sys.exit(1)

    payload = {
        "model": "deepseek/deepseek-chat",
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": build_user_input(product, category, mode)},
        ],
        "temperature": 0.9,
        "max_tokens": 1800,
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost",
            "X-Title": "scriptgen-mvp",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            data = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        print(f"HTTP {e.code}: {body}")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    try:
        text = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        print("RESPONSE GAGAL DIPARSE:", json.dumps(data, ensure_ascii=False)[:2000])
        sys.exit(1)

    print(f"===== HASIL — {product} [{category}] MODE {mode.upper()} =====\n")
    print(text)


if __name__ == "__main__":
    main()
