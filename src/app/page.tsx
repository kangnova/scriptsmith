"use client";

import { useEffect, useRef, useState } from "react";
import GoogleOneTap from "@/components/GoogleOneTap";

type Lang = "id" | "en";

interface Dict {
  tagline: string;
  productLabel: string;
  productPlaceholder: string;
  priceLabel: string;
  pricePlaceholder: string;
  linkLabel: string;
  linkPlaceholder: string;
  linkHint: string;
  categoryLabel: string;
  categoryPlaceholder: string;
  categoryHint: string;
  categorySuggesting: string;
  suggestedLabel: string;
  languageLabel: string;
  modeLabel: string;
  formatLabel: string;
  formatVideo: string;
  formatThreads: string;
  textOnly: string;
  textVideo: string;
  generate: string;
  generating: string;
  forging: string;
  result: string;
  copy: string;
  copied: string;
  required: string;
  loginRequired: string;
  quotaExceeded: string;
  quotaLeft: string;
  proActive: string;
  validUntil: string;
  freePlan: string;
  proPlan: string;
  perMonth: string;
  perYear: string;
  pricingTitle: string;
  pricingSub: string;
  upgradeCta: string;
  contactWa: string;
  mostPopular: string;
  saveBadge: string;
  freeFeature: string;
  unlimitedFeature: string;
  videoLocked: string;
  choosePlan: string;
  textTier: string;
  videoTier: string;
  textTierFeature: string;
  videoTierFeature: string;
}

const STRINGS: Record<Lang, Dict> = {
  id: {
    tagline:
      "Pembuat naskah konten jualan untuk TikTok, Reels & Shorts — lengkap hook, naskah, ajakan beli, caption + hashtag, pilihan musik, dan panduan video yang tinggal copy-paste.",
    productLabel: "Nama produk",
    productPlaceholder: "contoh: Glow Whitening Serum",
    priceLabel: "Harga (Rp)",
    pricePlaceholder: "contoh: Rp 49.000",
    linkLabel: "Link produk (opsional)",
    linkPlaceholder: "contoh: https://tokopedia.link/xyz",
    linkHint: "Opsional — caption & ajakan beli akan menyebut link ini.",
    categoryLabel: "Kategori",
    categoryPlaceholder: "Ketik bebas — mis. skincare, mainan, kopi",
    categoryHint: "Ketik kategori apa saja, atau pilih saran di bawah.",
    categorySuggesting: "Mencari saran kategori…",
    suggestedLabel: "Saran kategori (klik untuk pilih):",
    languageLabel: "Bahasa",
    formatLabel: "Jenis konten",
    formatVideo: "Video pendek",
    formatThreads: "Threads / Carousel",
    modeLabel: "Mode hasil",
    textOnly: "Teks saja",
    textVideo: "Teks + panduan video",
    generate: "Buat naskah",
    generating: "Membuat…",
    forging: "Menempa naskah jualanmu…",
    result: "Hasil",
    copy: "Salin",
    copied: "Tersalin!",
    required: "Nama produk dan harga wajib diisi.",
    loginRequired:
      "Login dulu pakai Google untuk membuat naskah (gratis 2 naskah/hari).",
    quotaExceeded:
      "Kuota gratis hari ini sudah habis (2 naskah/hari). Upgrade ke PRO untuk naskah unlimited.",
    quotaLeft: "Sisa kuota gratis hari ini",
    proActive: "PRO aktif",
    validUntil: "berlaku sampai",
    freePlan: "Gratis",
    proPlan: "PRO",
    perMonth: "/bulan",
    perYear: "/tahun",
    pricingTitle: "Harga",
    pricingSub:
      "Gratis 2 naskah/hari (teks). Upgrade untuk naskah unlimited; mode video khusus paket Teks + Video.",
    upgradeCta: "Upgrade ke PRO",
    contactWa: "Konfirmasi lewat WhatsApp",
    mostPopular: "PALING LARIS",
    saveBadge: "Hemat",
    freeFeature: "2 naskah per hari (teks saja)",
    unlimitedFeature: "Naskah teks unlimited",
    videoLocked:
      "Mode video butuh paket Teks + Video (Rp 75.000/bulan).",
    choosePlan: "Pilih paket",
    textTier: "Teks saja",
    videoTier: "Teks + Video",
    textTierFeature: "Naskah teks unlimited",
    videoTierFeature: "Naskah teks + panduan video unlimited",
  },
  en: {
    tagline:
      "Selling-content scripts for TikTok, Reels & Shorts — hook, script, CTA, caption + hashtags, music pick, and a copy-paste video guide.",
    productLabel: "Product name",
    productPlaceholder: "e.g. Glow Whitening Serum",
    priceLabel: "Price (IDR)",
    pricePlaceholder: "e.g. Rp 49.000",
    linkLabel: "Product link (optional)",
    linkPlaceholder: "e.g. https://tokopedia.link/xyz",
    linkHint: "Optional — the caption & CTA will mention this link.",
    categoryLabel: "Category",
    categoryPlaceholder: "Type any — e.g. skincare, mainan, kopi",
    categoryHint: "Type any category, or pick a suggestion below.",
    categorySuggesting: "Finding category suggestions…",
    suggestedLabel: "Suggested categories (click to pick):",
    languageLabel: "Language",
    formatLabel: "Content type",
    formatVideo: "Short video",
    formatThreads: "Threads / Carousel",
    modeLabel: "Output mode",
    textOnly: "Text only",
    textVideo: "Text + video guide",
    generate: "Generate script",
    generating: "Generating…",
    forging: "Forging your selling script…",
    result: "Result",
    copy: "Copy",
    copied: "Copied!",
    required: "Product name and price are required.",
    loginRequired:
      "Sign in with Google to generate scripts (free 2/day).",
    quotaExceeded:
      "Free daily quota used up (2/day). Upgrade to PRO for unlimited scripts.",
    quotaLeft: "Free quota left today",
    proActive: "PRO active",
    validUntil: "valid until",
    freePlan: "Free",
    proPlan: "PRO",
    perMonth: "/month",
    perYear: "/year",
    pricingTitle: "Pricing",
    pricingSub:
      "Free 2 scripts/day (text). Upgrade for unlimited scripts; video mode is for the Text + Video plan.",
    upgradeCta: "Upgrade to PRO",
    contactWa: "Confirm via WhatsApp",
    mostPopular: "MOST POPULAR",
    saveBadge: "Save",
    freeFeature: "2 scripts per day (text only)",
    unlimitedFeature: "Unlimited text scripts",
    videoLocked:
      "Video mode requires the Text + Video plan (Rp 75,000/month).",
    choosePlan: "Choose plan",
    textTier: "Text only",
    videoTier: "Text + Video",
    textTierFeature: "Unlimited text scripts",
    videoTierFeature: "Unlimited text + video guides",
  },
};

interface MeData {
  loggedIn: boolean;
  plan?: "FREE" | "PRO_TEXT" | "PRO_VIDEO";
  planExpiresAt?: string | null;
  canVideo?: boolean;
  usedToday?: number;
  dailyLimit?: number;
  remainingToday?: number;
  priceText?: number;
  priceVideo?: number;
  upgradeWhatsapp?: string;
  paymentInfo?: string;
}

export default function Home() {
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [lang, setLang] = useState<Lang>("id");
  const [mode, setMode] = useState<"text" | "video">("video");
  const [format, setFormat] = useState<"video" | "threads">("video");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const reqIdRef = useRef(0);

  const [me, setMe] = useState<MeData | null>(null);
  const [paying, setPaying] = useState<null | "TEXT" | "VIDEO">(null);

  async function fetchMe() {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        const d = json.data as MeData;
        setMe(d);
        if (!d.canVideo) setMode("text");
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  const t = STRINGS[lang];
  const fmtRp = (n: number) => n.toLocaleString("id-ID");

  useEffect(() => {
    const value = product.trim();
    if (value.length < 3) {
      setSuggestions([]);
      setSuggesting(false);
      return;
    }
    const timer = setTimeout(async () => {
      const reqId = ++reqIdRef.current;
      setSuggesting(true);
      try {
        const res = await fetch("/api/suggest-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: value, lang }),
        });
        const json = await res.json();
        if (reqId !== reqIdRef.current) return;
        setSuggestions(res.ok && json.ok ? (json.data?.categories ?? []) : []);
      } catch {
        if (reqId === reqIdRef.current) setSuggestions([]);
      } finally {
        if (reqId === reqIdRef.current) setSuggesting(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [product, lang]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim() || !price.trim()) {
      setError(t.required);
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, price, link, category, lang, mode, format }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (res.status === 401 || json.error === "LOGIN_REQUIRED") {
          setError(t.loginRequired);
        } else if (res.status === 429 || json.error === "QUOTA_EXCEEDED") {
          setError(t.quotaExceeded);
        } else if (
          res.status === 402 ||
          json.error === "VIDEO_UPGRADE_REQUIRED"
        ) {
          setError(t.videoLocked);
        } else {
          setError(json.error || `Request failed (${res.status})`);
        }
        return;
      }
      setResult(json.data?.text ?? "");
      fetchMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(result);
      } else {
        const ta = document.createElement("textarea");
        ta.value = result;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function subscribe(tier: "TEXT" | "VIDEO") {
    setPaying(tier);
    setError("");
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || `Gagal memproses (${res.status})`);
        return;
      }
      const url = json.data?.redirectUrl;
      if (url) {
        window.location.href = url;
      } else {
        setError("Tidak ada link pembayaran. Coba lagi.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPaying(null);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-2xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">ScriptSmith</h1>
          <p className="mt-1 text-sm text-slate-500">{t.tagline}</p>
        </header>

        {me && !me.loggedIn && <GoogleOneTap />}

        {me && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            {me.loggedIn ? (
              me.plan === "PRO_TEXT" || me.plan === "PRO_VIDEO" ? (
                <span className="font-semibold text-emerald-700">
                  ✓ {t.proActive} ({me.plan === "PRO_VIDEO" ? t.videoTier : t.textTier})
                  {me.planExpiresAt && (
                    <span className="ml-2 font-normal text-slate-500">
                      {t.validUntil}{" "}
                      {new Date(me.planExpiresAt).toLocaleDateString("id-ID")}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-700">
                  {t.quotaLeft}:{" "}
                  <strong>
                    {me.remainingToday ?? 0}/{me.dailyLimit ?? 0}
                  </strong>
                </span>
              )
            ) : (
              <span className="text-slate-600">{t.loginRequired}</span>
            )}
            {me.loggedIn ? (
              <a
                href="#pricing"
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
              >
                {t.upgradeCta}
              </a>
            ) : (
              <div className="flex shrink-0 gap-2">
                <a
                  href="/register"
                  className="rounded-lg border border-orange-600 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                >
                  {lang === "id" ? "Daftar" : "Sign up"}
                </a>
                <a
                  href="/login"
                  className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                >
                  {lang === "id" ? "Login" : "Sign in"}
                </a>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t.productLabel}
              </label>
              <input
                className={inputCls}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder={t.productPlaceholder}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t.priceLabel}
              </label>
              <input
                className={inputCls}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t.pricePlaceholder}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t.categoryLabel}
              </label>
              <input
                className={inputCls}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t.categoryPlaceholder}
              />
              <p className="mt-1 text-xs text-slate-400">{t.categoryHint}</p>
              {suggesting && (
                <p className="mt-1 text-xs text-slate-400">
                  {t.categorySuggesting}
                </p>
              )}
              {suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-500">
                    {t.suggestedLabel}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCategory(s)}
                        className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t.linkLabel}
              </label>
              <input
                className={inputCls}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={t.linkPlaceholder}
              />
              <p className="mt-1 text-xs text-slate-400">{t.linkHint}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t.languageLabel}
              </label>
              <div className="flex gap-3">
                {(["id", "en"] as const).map((l) => (
                  <label
                    key={l}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="lang"
                      checked={lang === l}
                      onChange={() => setLang(l)}
                      className="accent-orange-600"
                    />
                    {l === "id" ? "Indonesia" : "English"}
                  </label>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t.formatLabel}
              </label>
              <div className="flex gap-3">
                {(["video", "threads"] as const).map((f) => (
                  <label
                    key={f}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={format === f}
                      onChange={() => setFormat(f)}
                      className="accent-orange-600"
                    />
                    {f === "video" ? t.formatVideo : t.formatThreads}
                  </label>
                ))}
              </div>
            </div>
            {format === "video" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t.modeLabel}
              </label>
              <div className="flex gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "text"}
                    onChange={() => setMode("text")}
                    className="accent-orange-600"
                  />
                  {t.textOnly}
                </label>
                {me?.canVideo ? (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === "video"}
                      onChange={() => setMode("video")}
                      className="accent-orange-600"
                    />
                    {t.textVideo}
                  </label>
                ) : (
                  <a
                    href="#pricing"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-400"
                  >
                    🔒 {t.textVideo}
                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                      PRO
                    </span>
                  </a>
                )}
              </div>
            </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? t.generating : t.generate}
          </button>
        </form>

        {loading && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-1 text-2xl font-bold">
              <span className="anim-shimmer bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-clip-text text-transparent">
                ScriptSmith
              </span>
              <span className="anim-blink text-orange-600">|</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="anim-dot h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span
                className="anim-dot h-2.5 w-2.5 rounded-full bg-orange-500"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="anim-dot h-2.5 w-2.5 rounded-full bg-orange-500"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
            <p className="text-sm text-slate-500">{t.forging}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                {t.result}
              </h2>
              <button
                onClick={copyResult}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                {copied ? t.copied : t.copy}
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
              {result}
            </pre>
          </section>
        )}

        <section id="pricing" className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">{t.pricingTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">{t.pricingSub}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-700">
                {t.freePlan}
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Rp 0</div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li>• {t.freeFeature}</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-700">
                {t.textTier} {t.perMonth}
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                Rp {fmtRp(me?.priceText ?? 0)}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li>• {t.textTierFeature}</li>
              </ul>
              <button
                type="button"
                disabled={paying !== null}
                onClick={() => subscribe("TEXT")}
                className="mt-4 w-full rounded-lg border border-orange-600 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-50"
              >
                {paying === "TEXT" ? t.generating : t.choosePlan}
              </button>
            </div>

            <div className="relative rounded-xl border-2 border-orange-500 bg-white p-5 shadow-sm">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                {t.mostPopular}
              </span>
              <div className="text-sm font-semibold text-slate-700">
                {t.videoTier} {t.perMonth}
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                Rp {fmtRp(me?.priceVideo ?? 0)}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                <li>• {t.videoTierFeature}</li>
              </ul>
              <button
                type="button"
                disabled={paying !== null}
                onClick={() => subscribe("VIDEO")}
                className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {paying === "VIDEO" ? t.generating : t.choosePlan}
              </button>
            </div>
          </div>

          {(me?.paymentInfo || me?.upgradeWhatsapp) && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">
                {t.contactWa}
              </h3>
              {me?.paymentInfo && (
                <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {me.paymentInfo}
                </pre>
              )}
              {me?.upgradeWhatsapp && (
                <a
                  href={`https://wa.me/${me.upgradeWhatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
