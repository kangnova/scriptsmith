import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  return (
    <div>
      <nav className="flex gap-5 border-b border-slate-200 bg-white px-5 py-3 text-sm">
        <a
          href="/admin"
          className="font-medium text-slate-700 hover:text-slate-900"
        >
          Overview
        </a>
        <a
          href="/admin/users"
          className="font-medium text-slate-700 hover:text-slate-900"
        >
          Users
        </a>
      </nav>
      <main className="p-5">{children}</main>
    </div>
  );
}
