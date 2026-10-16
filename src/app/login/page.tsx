"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import GoogleButton from "@/components/GoogleButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams?.get("error") ?? "";
  const registered = searchParams?.get("registered");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        username: identifier,
        password,
      });
      if (res?.error) {
        setError("Username/email atau password salah.");
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

  function loginWithGoogle() {
    signIn("google", { callbackUrl: "/" });
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">ScriptSmith</h1>
        <p className="mt-1 text-sm text-slate-500">
          Login untuk melanjutkan. Belum punya akun?{" "}
          <a href="/register" className="font-medium text-orange-600 hover:underline">
            Daftar dulu
          </a>
          .
        </p>

        {registered && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Akun berhasil dibuat. Silakan login.
          </div>
        )}

        {errorCode === "EmailNotRegistered" && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Email Google ini belum terdaftar.{" "}
            <a href="/register" className="font-medium underline">
              Daftar dulu
            </a>{" "}
            sebelum login dengan Google.
          </div>
        )}

        {errorCode === "OAuthAccountNotLinked" && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Email ini terdaftar tapi belum tertaut ke Google. Login dengan
            username/password dulu, atau{" "}
            <a href="/register" className="font-medium underline">
              daftar ulang
            </a>
            .
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Username atau email
            </label>
            <input
              className={inputCls}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username / email"
              autoComplete="username"
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
              placeholder="••••••"
              autoComplete="current-password"
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
            {busy ? "Memproses…" : "Login"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          atau
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <GoogleButton
          onClick={loginWithGoogle}
          disabled={busy}
          label="Login dengan Google"
        />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
