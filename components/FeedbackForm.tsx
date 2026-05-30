"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { StarRating } from "@/components/StarRating";
import { ProgressBar } from "@/components/ProgressBar";

type Teammate = {
  id: string;
  name: string;
  email: string;
};

type FeedbackDraft = {
  rating: number;
  strengths: string;
  improvements: string;
};

function isComplete(draft: FeedbackDraft) {
  return draft.rating >= 1 && draft.strengths.trim().length >= 3 && draft.improvements.trim().length >= 3;
}

export function FeedbackForm({
  formId,
  currentUserId,
  title,
  groupName,
  teammates,
  alreadySubmitted,
}: {
  formId: string;
  currentUserId: string;
  title: string;
  groupName: string;
  teammates: Teammate[];
  alreadySubmitted: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, FeedbackDraft>>(() =>
    Object.fromEntries(teammates.map((member) => [member.id, { rating: 3, strengths: "", improvements: "" }])),
  );

  const completed = useMemo(
    () =>
      teammates.filter((member) => {
        const draft = drafts[member.id];
        return isComplete(draft);
      }).length,
    [drafts, teammates],
  );

  function updateDraft(userId: string, patch: Partial<FeedbackDraft>) {
    setDrafts((current) => ({
      ...current,
      [userId]: { ...current[userId], ...patch },
    }));
  }

  async function submit() {
    if (completed !== teammates.length) {
      toast.error("Please add a rating, strength, and improvement for every teammate.");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formId,
        submittedByUserId: currentUserId,
        feedback: teammates.map((member) => ({
          targetUserId: member.id,
          ...drafts[member.id],
          strengths: drafts[member.id].strengths.trim(),
          improvements: drafts[member.id].improvements.trim(),
        })),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      toast.error(payload.message ?? "Unable to submit feedback");
      return;
    }

    toast.success("Feedback submitted");
    router.push(`/dashboard?userId=${currentUserId}`);
    router.refresh();
  }

  if (alreadySubmitted) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Feedback already submitted</h2>
        <p className="mt-2 text-slate-600">Your responses are recorded anonymously for this form.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">{groupName}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">{title}</h1>
        <div className="mt-4">
          <ProgressBar value={completed} max={teammates.length} />
        </div>
      </div>

      {teammates.map((member) => {
        const draft = drafts[member.id];
        return (
          <section key={member.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{member.name}</h2>
                <p className="text-sm text-slate-500">{member.email}</p>
              </div>
              <StarRating value={draft.rating} onChange={(rating) => updateDraft(member.id, { rating })} />
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-700">What did this person do well?</span>
              <textarea
                value={draft.strengths}
                onChange={(event) => updateDraft(member.id, { strengths: event.target.value })}
                minLength={3}
                rows={4}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">What could this person improve?</span>
              <textarea
                value={draft.improvements}
                onChange={(event) => updateDraft(member.id, { improvements: event.target.value })}
                minLength={3}
                rows={4}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </section>
        );
      })}

      <div className="sticky bottom-0 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-400"
        >
          {submitting ? "Submitting..." : "Submit anonymous feedback"}
        </button>
      </div>
    </div>
  );
}
