"use client";

import type { Session } from "next-auth";
import { signOut } from "next-auth/react";

export default function Header({ session }: { session: Session | null }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
      <a href="/" className="text-lg font-bold text-slate-900">
        ScriptSmith
      </a>
      <div className="flex items-center gap-3 text-sm">
        {session?.user ? (
          <>
            <span className="hidden text-slate-600 sm:inline">
              {session.user.email}
            </span>
            {session.user.role === "ADMIN" && (
              <a
                href="/admin"
                className="font-medium text-orange-600 hover:underline"
              >
                Admin
              </a>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="font-medium text-slate-500 hover:text-slate-800"
            >
              Sign out
            </button>
          </>
        ) : (
          <a
            href="/login"
            className="font-medium text-orange-600 hover:underline"
          >
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
