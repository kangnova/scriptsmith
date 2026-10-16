"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import GoogleButton from "@/components/GoogleButton";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || `Gagal (${res.status})`);
        return;
      }
      // Langsung login setelah daftar.
      const sign = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });
      if (sign?.error) {
        router.push("/login?registered=1");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function registerWithGoogle() {
    setError("");
    setBusy(true);
    try {
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
      if (!w.google) {
        setError("Layanan Google belum termuat. Coba lagi.");
        setBusy(false);
        return;
      }
      w.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
        callback: async (resp: { credential?: string }) => {
          if (!resp.credential) {
            setBusy(false);
            return;
          }
          try {
            const res = await fetch("/api/register-google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: resp.credential }),
            });
            const json = await res.json();
            if (!res.ok || !json.ok) {
              setError(
                json.error ||
                  "Email Google ini belum bisa didaftarkan. Coba lagi."
              );
              setBusy(false);
              return;
            }
            const sign = await signIn("credentials", {
              redirect: false,
              googleIdToken: resp.credential,
            });
            if (sign?.error) {
              setError("Akun dibuat tapi gagal login otomatis. Silakan login.");
              router.push("/login");
              setBusy(false);
              return;
            }
            router.push("/");
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setBusy(false);
          }
        },
      });
      w.google.accounts.id.prompt();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Daftar akun</h1>
        <p className="mt-1 text-sm text-slate-500">
          Buat akun untuk mulai membuat naskah. Gratis 2 naskah/hari.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nama (opsional)
            </label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              className={inputCls}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="huruf kecil, angka, titik, - , _"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              className={inputCls}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimal 6 karakter"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Konfirmasi password
            </label>
            <input
              className={inputCls}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="ulangi password"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : "Daftar"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          atau
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <GoogleButton
          onClick={registerWithGoogle}
          disabled={busy}
          label="Daftar dengan Google"
        />

        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <a href="/login" className="font-medium text-orange-600 hover:underline">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}
