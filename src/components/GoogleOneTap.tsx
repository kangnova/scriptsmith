"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Google One Tap: otomatis mendeteksi akun Google yang sedang aktif di
 * browser dan memunculkan notifikasi login. Klik notifikasi -> login.
 * Kalau email belum terdaftar, tampilkan ajakan daftar.
 */
export default function GoogleOneTap() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;

    function startOneTap() {
      const w = window as unknown as {
        google?: {
          accounts: {
            id: {
              initialize: (o: Record<string, unknown>) => void;
              prompt: () => void;
            };
          };
        };
      };
      if (!w.google?.accounts?.id) return;

      w.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: { credential?: string }) => {
          if (cancelled || !resp.credential) return;
          const res = await signIn("credentials", {
            redirect: false,
            googleIdToken: resp.credential,
          });
          if (res?.error) {
            setMessage(
              "Email Google ini belum terdaftar. Silakan daftar dulu."
            );
          } else {
            window.location.href = "/";
          }
        },
      });
      w.google.accounts.id.prompt();
    }

    if ((window as unknown as { google?: unknown }).google) {
      startOneTap();
    } else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = startOneTap;
      document.body.appendChild(s);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (!message) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
      <span>{message}</span>
      <a
        href="/register"
        className="shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
      >
        Daftar
      </a>
    </div>
  );
}
