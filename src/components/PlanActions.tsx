"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlanActions({
  userId,
  plan,
  planExpiresAt,
}: {
  userId: string;
  plan: string;
  planExpiresAt: Date | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setPlan(action: "monthly" | "yearly" | "free") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || `Failed (${res.status})`);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const btn =
    "rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-40";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className={
            plan === "PRO"
              ? "font-semibold text-emerald-600"
              : "text-slate-500"
          }
        >
          {plan}
        </span>
        {plan === "PRO" && planExpiresAt && (
          <span className="text-xs text-slate-400">
            s/d {planExpiresAt.toISOString().slice(0, 10)}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => setPlan("monthly")}
          className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
        >
          +30 hari
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setPlan("yearly")}
          className={`${btn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
        >
          +1 tahun
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setPlan("free")}
          className={`${btn} border-slate-200 bg-white text-slate-500 hover:bg-slate-50`}
        >
          Free
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
