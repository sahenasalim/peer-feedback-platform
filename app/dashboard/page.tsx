import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProgressBar } from "@/components/ProgressBar";
import { SummaryCard } from "@/components/SummaryCard";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardPage({ searchParams }: { searchParams: { userId?: string } }) {
  const userId = searchParams.userId;
  if (!userId) redirect("/login");

  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!student) redirect("/login");

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const groupIds = memberships.map((membership) => membership.groupId);

  const forms = await prisma.feedbackForm.findMany({
    where: { groupId: { in: groupIds } },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { name: true, members: { select: { userId: true } } } },
      submissions: {
        where: { submittedByUserId: userId },
        select: { targetUserId: true },
      },
    },
  });

  const summaries = await prisma.aISummary.findMany({
    where: { targetUserId: userId },
    orderBy: { generatedAt: "desc" },
    include: { form: { select: { title: true } } },
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="glass-card rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-strong">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Student dashboard</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-950">{student.name}</h1>
            <p className="mt-2 text-slate-600">{student.email}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <section className="mt-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Feedback forms</h2>
            <p className="mt-1 text-sm text-slate-600">Open a form, review each teammate, then return here to see progress and AI summaries.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {forms.length ? (
            forms.map((form) => {
              const totalTargets = Math.max(form.group.members.length - 1, 0);
              const reviewedCount = form.submissions.length;
              const complete = reviewedCount >= totalTargets && totalTargets > 0;
              return (
                <article key={form.id} className="group rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">{form.group.name}</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-950">{form.title}</h3>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${form.isOpen ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                      {form.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-5">
                    <ProgressBar value={reviewedCount} max={totalTargets} />
                  </div>
                  <Link
                    href={`/feedback/${form.id}?userId=${userId}`}
                    className={`mt-5 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                      form.isOpen && !complete ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {complete ? "Submitted" : form.isOpen ? "Review teammates" : "View status"}
                  </Link>
                </article>
              );
            })
          ) : (
            <div className="glass-card rounded-[1.75rem] border border-dashed border-slate-300 bg-white/90 p-8 text-center text-slate-600 md:col-span-2">
              No feedback forms yet.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-950">AI summaries</h2>
        <div className="mt-4 space-y-4">
          {summaries.length ? (
            summaries.map((summary, index) => (
              <SummaryCard
                key={summary.id}
                formTitle={summary.form.title}
                summaryText={summary.summaryText}
                status={summary.status}
                errorMessage={summary.errorMessage}
                fresh={index === 0}
              />
            ))
          ) : (
            <div className="glass-card rounded-[1.75rem] border border-dashed border-slate-300 bg-white/90 p-8 text-center text-slate-600">
              No AI summaries yet. Ask the admin to generate a summary after you receive teammate feedback.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
