import { prisma } from "@/lib/prisma";
import { AdminGroupManager } from "@/components/AdminGroupManager";
import { AdminGate } from "@/components/AdminGate";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [groups, users, forms] = await Promise.all([
    prisma.group.findMany({
      orderBy: { createdAt: "desc" },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
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
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="glass-card rounded-[2rem] p-8 shadow-strong mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Admin</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950">Peer feedback control center</h1>
            <p className="mt-1 text-sm text-slate-500">Create review forms, monitor submissions, and generate AI summaries.</p>
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