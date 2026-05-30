import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FeedbackForm } from "@/components/FeedbackForm";

export default async function FeedbackPage({
  params,
  searchParams,
}: {
  params: { formId: string };
  searchParams: { userId?: string };
}) {
  const userId = searchParams.userId;
  if (!userId) redirect("/login");

  const form = await prisma.feedbackForm.findUnique({
    where: { id: params.formId },
    include: {
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      },
      submissions: {
        where: { submittedByUserId: userId },
        select: { targetUserId: true },
      },
    },
  });

  if (!form) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-950">Form not found</h1>
          <Link href="/login" className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Back to login</Link>
        </div>
      </main>
    );
  }

  const isMember = form.group.members.some((member) => member.userId === userId);
  if (!isMember) redirect("/login");

  const teammates = form.group.members
    .filter((member) => member.userId !== userId)
    .map((member) => member.user);
  const alreadySubmitted = form.submissions.length >= teammates.length && teammates.length > 0;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <Link href={`/dashboard?userId=${userId}`} className="text-sm font-medium text-emerald-700">Back to dashboard</Link>
      <div className="mt-4">
        {form.isOpen ? (
          <FeedbackForm
            formId={form.id}
            currentUserId={userId}
            title={form.title}
            groupName={form.group.name}
            teammates={teammates}
            alreadySubmitted={alreadySubmitted}
          />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-slate-950">This form is closed</h1>
            <p className="mt-2 text-slate-600">Feedback submitted for {form.submissions.length}/{teammates.length} teammates.</p>
          </div>
        )}
      </div>
    </main>
  );
}
