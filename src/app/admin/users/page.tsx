import { prisma } from "@/lib/prisma";
import PlanActions from "@/components/PlanActions";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Users</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2.5 text-slate-800">{u.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-slate-800">{u.email ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      u.role === "ADMIN"
                        ? "font-medium text-orange-600"
                        : "text-slate-600"
                    }
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <PlanActions
                    userId={u.id}
                    plan={u.plan}
                    planExpiresAt={u.planExpiresAt}
                  />
                </td>
                <td className="px-4 py-2.5 text-slate-500">
                  {u.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="px-4 py-3 text-sm text-slate-500">No users yet.</div>
        )}
      </div>
    </div>
  );
}
