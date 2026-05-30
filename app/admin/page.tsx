import { prisma } from "@/lib/prisma";
import { AdminGroupManager } from "@/components/AdminGroupManager";
import { AdminGate } from "@/components/AdminGate";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AdminPage() {
  const [groups, users, forms] = await Promise.all([
    prisma.group.findMany({
      orderBy: { createdAt: "desc" },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.feedbackForm.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        group: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } },
        submissions: { select: { targetUserId: true, rating: true } },
        summaries: { select: { targetUserId: true, status: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <header className="glass-card mb-8 rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-strong">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Admin</p>
            <h1 className="text-3xl font-bold text-slate-950">Peer feedback control center</h1>
            <p className="mt-2 text-slate-600">Create review forms, monitor submissions, and generate AI summaries.</p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <AdminGate>
        <AdminGroupManager initialGroups={groups} initialUsers={users} initialForms={forms} />
      </AdminGate>
    </main>
  );
}
