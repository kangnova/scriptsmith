import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [totalUsers, adminCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Admin Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total users</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">
            {totalUsers}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Admins</div>
          <div className="mt-1 text-3xl font-bold text-slate-900">
            {adminCount}
          </div>
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-lg font-semibold text-slate-900">
        Recent signups
      </h2>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {recentUsers.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span className="text-slate-800">{u.name ?? u.email}</span>
            <span className="text-slate-500">
              {u.createdAt.toISOString().slice(0, 10)}
            </span>
          </div>
        ))}
        {recentUsers.length === 0 && (
          <div className="px-4 py-3 text-sm text-slate-500">No users yet.</div>
        )}
      </div>
    </div>
  );
}
