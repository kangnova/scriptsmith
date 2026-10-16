"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserActionsProps {
  userId: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: string;
  isSelf: boolean;
}

type Mode = null | "edit" | "reset";

export default function UserActions({
  userId,
  name,
  username,
  email,
  role,
  isSelf,
}: UserActionsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // edit fields
  const [fName, setFName] = useState(name ?? "");
  const [fUsername, setFUsername] = useState(username ?? "");
  const [fEmail, setFEmail] = useState(email ?? "");
  const [fRole, setFRole] = useState(role === "ADMIN" ? "ADMIN" : "USER");
  // reset field
  const [fPassword, setFPassword] = useState("");

  function open(m: Mode) {
    setError("");
    if (m === "edit") {
      setFName(name ?? "");
      setFUsername(username ?? "");
      setFEmail(email ?? "");
      setFRole(role === "ADMIN" ? "ADMIN" : "USER");
    }
    if (m === "reset") setFPassword("");
    setMode(m);
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/manage-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || `Gagal (${res.status})`);
        return false;
      }
      setMode(null);
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Hapus akun ${email ?? username ?? userId}? Data tidak bisa dikembalikan.`)) {
      return;
    }
    await post({ userId, action: "delete" });
  }

  const btn =
    "rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-40";

  return (
    <div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => open("edit")}
          className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => open("reset")}
          className={`${btn} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
        >
          Reset password
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSelf}
          title={isSelf ? "Tidak bisa menghapus akun sendiri" : ""}
          className={`${btn} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
        >
          Hapus
        </button>
      </div>

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {mode === "edit" ? "Edit akun" : "Reset password"}
              </h3>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {mode === "edit" ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Nama
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Username
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={fUsername}
                    onChange={(e) => setFUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Email
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={fEmail}
                    onChange={(e) => setFEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Role
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={fRole}
                    onChange={(e) => setFRole(e.target.value)}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Password baru (minimal 6 karakter)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={fPassword}
                  onChange={(e) => setFPassword(e.target.value)}
                  placeholder="password baru"
                />
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  mode === "edit"
                    ? post({
                        userId,
                        action: "edit",
                        name: fName,
                        username: fUsername,
                        email: fEmail,
                        role: fRole,
                      })
                    : post({ userId, action: "resetPassword", password: fPassword })
                }
                className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-40"
              >
                {busy ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
