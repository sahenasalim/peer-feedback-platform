import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProgressBar } from "@/components/ProgressBar";
import { SummaryCard } from "@/components/SummaryCard";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

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
  const groupIds = memberships.map((m) => m.groupId);

  const forms = await prisma.feedbackForm.findMany({
    where: { groupId: { in: groupIds } },
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { name: true, members: { select: { userId: true } } } },
      submissions: { where: { submittedByUserId: userId }, select: { targetUserId: true } },
    },
  });

  const summaries = await prisma.aISummary.findMany({
    where: { targetUserId: userId },
    orderBy: { generatedAt: "desc" },
    include: { form: { select: { title: true } } },
  });

  const totalForms = forms.length;
  const completedForms = forms.filter((form) => {
    const total = Math.max(form.group.members.length - 1, 0);
    return form.submissions.length >= total && total > 0;
  }).length;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">

      {/* Header */}
      <header className="glass-card rounded-[2rem] p-8 shadow-strong">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-700">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Student dashboard</p>
              <h1 className="mt-0.5 text-3xl font-bold text-slate-950">{student.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{student.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <LogoutButton />
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-950">{totalForms}</p>
                <p className="text-xs text-slate-500">forms</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-emerald-600">{completedForms}</p>
                <p className="text-xs text-slate-500">completed</p>
              </div>
              <div className="w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-950">{summaries.length}</p>
                <p className="text-xs text-slate-500">summaries</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Feedback Forms */}
      <section className="mt-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Feedback forms</h2>
            <p className="mt-1 text-sm text-slate-500">Review each teammate anonymously, then check back for your AI summary.</p>
          </div>
          {totalForms > 0 && (
            <span className="stat-pill">
              {completedForms}/{totalForms} done
            </span>
          )}
        </div>

        {forms.length === 0 ? (
          <div className="glass-card rounded-[1.75rem] border border-dashed border-slate-300 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-medium text-slate-700">No feedback forms yet</p>
            <p className="mt-1 text-sm text-slate-500">Your admin will create a form when it's time to review your group.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {forms.map((form) => {
              const totalTargets = Math.max(form.group.members.length - 1, 0);
              const reviewedCount = form.submissions.length;
              const complete = reviewedCount >= totalTargets && totalTargets > 0;
              return (
                <article key={form.id} className="glass-card card-hover rounded-[1.75rem] p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{form.group.name}</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-950">{form.title}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      complete ? "bg-emerald-100 text-emerald-700" :
                      form.isOpen ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {complete ? "✓ Done" : form.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <ProgressBar value={reviewedCount} max={totalTargets} />
                  </div>

                  <Link
                    href={`/feedback/${form.id}?userId=${userId}`}
                    className={`mt-4 flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition ${
                      form.isOpen && !complete
                        ? "bg-slate-950 text-white hover:bg-slate-800"
                        : "bg-slate-100 text-slate-400 cursor-default pointer-events-none"
                    }`}
                  >
                    {complete ? "✓ Submitted" : form.isOpen ? "Review teammates →" : "Form closed"}
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Summaries */}
      <section className="mt-10">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-950">AI summaries</h2>
          <p className="mt-1 text-sm text-slate-500">Generated by Groq (LLaMA 3.3 70B) from your anonymous peer feedback.</p>
        </div>

        {summaries.length === 0 ? (
          <div className="glass-card rounded-[1.75rem] border border-dashed border-slate-300 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="font-medium text-slate-700">No AI summaries yet</p>
            <p className="mt-1 text-sm text-slate-500">Once your teammates submit their reviews, ask the admin to generate your summary.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary, index) => (
              <SummaryCard
                key={summary.id}
                formTitle={summary.form.title}
                summaryText={summary.summaryText}
                status={summary.status}
                errorMessage={summary.errorMessage}
                fresh={index === 0}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}