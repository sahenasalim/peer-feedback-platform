"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { StarRating } from "@/components/StarRating";

type User = { id: string; name: string; email: string };
type Group = { id: string; name: string; members: Array<{ user: User }> };
type AdminForm = {
  id: string;
  title: string;
  isOpen: boolean;
  groupId: string;
  group: Group;
  submissions: Array<{ targetUserId: string; rating: number }>;
  summaries: Array<{ targetUserId: string; status: string }>;
};

export function AdminGroupManager({ initialGroups, initialUsers, initialForms }: { initialGroups: Group[]; initialUsers: User[]; initialForms: AdminForm[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [users] = useState(initialUsers);
  const [forms, setForms] = useState(initialForms);
  const [groupName, setGroupName] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [memberGroupId, setMemberGroupId] = useState(initialGroups[0]?.id ?? "");
  const [formTitle, setFormTitle] = useState("");
  const [formGroupId, setFormGroupId] = useState(initialGroups[0]?.id ?? "");
  const [generating, setGenerating] = useState<string | null>(null);

  const students = users;
  const stats = useMemo(() => {
    const map = new Map<string, { ratings: number[]; name: string }>();
    for (const form of forms) {
      for (const member of form.group.members) {
        map.set(member.user.id, { ratings: [], name: member.user.name });
      }
      for (const submission of form.submissions) {
        const current = map.get(submission.targetUserId);
        if (current) current.ratings.push(submission.rating);
      }
    }
    return Array.from(map.entries()).map(([userId, value]) => ({
      userId,
      name: value.name,
      average: value.ratings.length ? value.ratings.reduce((sum, rating) => sum + rating, 0) / value.ratings.length : 0,
      count: value.ratings.length,
    }));
  }, [forms]);

  async function createGroup() {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName }),
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.message ?? "Unable to create group");
    setGroups((current) => [{ ...payload.group, members: [] }, ...current]);
    setGroupName("");
    toast.success("Group created");
  }

  async function addMember() {
    const response = await fetch(`/api/groups/${memberGroupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberUserId }),
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.message ?? "Unable to add member");
    setGroups((current) =>
      current.map((group) =>
        group.id === memberGroupId && !group.members.some((member) => member.user.id === payload.member.user.id)
          ? { ...group, members: [...group.members, { user: payload.member.user }] }
          : group,
      ),
    );
    toast.success("Member added");
  }

  async function createForm() {
    const response = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: formTitle, groupId: formGroupId }),
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.message ?? "Unable to create form");
    const group = groups.find((item) => item.id === formGroupId)!;
    setForms((current) => [{ ...payload.form, group, submissions: [], summaries: [] }, ...current]);
    setFormTitle("");
    toast.success("Form created");
  }

  async function toggleForm(form: AdminForm) {
    const response = await fetch(`/api/forms/${form.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOpen: !form.isOpen }),
    });
    const payload = await response.json();
    if (!response.ok) return toast.error(payload.message ?? "Unable to update form");
    setForms((current) => current.map((item) => (item.id === form.id ? { ...item, isOpen: payload.form.isOpen } : item)));
    toast.success(payload.form.isOpen ? "Form opened" : "Form closed");
  }

  async function deleteForm(form: AdminForm) {
    const confirmed = window.confirm(
      `Delete "${form.title}"? This also removes its feedback submissions and AI summaries.`,
    );
    if (!confirmed) return;

    const response = await fetch(`/api/forms/${form.id}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload.message ?? "Unable to delete form");
      return;
    }

    setForms((current) => current.filter((item) => item.id !== form.id));
    toast.success("Form deleted");
  }

  async function generateSummary(formId: string, targetUserId: string) {
    setGenerating(`${formId}:${targetUserId}`);
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, targetUserId }),
    });
    const payload = await response.json().catch(() => ({}));
    setGenerating(null);
    if (!response.ok) {
      toast.error(payload.message ?? payload.summary?.errorMessage ?? "Summary generation failed — retry");
    } else {
      toast.success("AI summary generated");
    }
    setForms((current) =>
      current.map((form) =>
        form.id === formId
          ? {
              ...form,
              summaries: [
                ...form.summaries.filter((summary) => summary.targetUserId !== targetUserId),
                { targetUserId, status: response.ok ? "GENERATED" : "FAILED" },
              ],
            }
          : form,
      ),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
      <aside className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Groups</h2>
          <div className="mt-4 flex gap-2">
            <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={createGroup} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Create</button>
          </div>
          <div className="mt-4 space-y-3">
            {groups.map((group) => (
              <div key={group.id} className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{group.name}</p>
                <p className="text-sm text-slate-500">{group.members.length} members</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Add member</h2>
          <select value={memberGroupId} onChange={(event) => setMemberGroupId(event.target.value)} className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select>
          <select value={memberUserId} onChange={(event) => setMemberUserId(event.target.value)} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Select student</option>
            {students.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
          </select>
          <button onClick={addMember} disabled={!memberGroupId || !memberUserId} className="mt-3 w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-400">Add member</button>
        </section>
      </aside>

      <main className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Create feedback form</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,180px,auto]">
            <input value={formTitle} onChange={(event) => setFormTitle(event.target.value)} placeholder="Form title" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <select value={formGroupId} onChange={(event) => setFormGroupId(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
            <button onClick={createForm} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white">Create</button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Feedback forms</h2>
          <div className="mt-4 space-y-4">
            {forms.map((form) => (
              <div key={form.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950">{form.title}</h3>
                    <p className="text-sm text-slate-500">{form.group.name} · {form.isOpen ? "Open" : "Closed"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleForm(form)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
                      {form.isOpen ? "Close" : "Open"}
                    </button>
                    <button onClick={() => deleteForm(form)} className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {form.group.members.map(({ user }) => {
                    const ratings = form.submissions.filter((submission) => submission.targetUserId === user.id).map((submission) => submission.rating);
                    const average = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
                    const summary = form.summaries.find((item) => item.targetUserId === user.id);
                    const key = `${form.id}:${user.id}`;
                    return (
                      <div key={user.id} className="rounded-md bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{ratings.length} reviews</p>
                          </div>
                          <StarRating value={Math.round(average)} readOnly />
                        </div>
                        <button
                          onClick={() => generateSummary(form.id, user.id)}
                          disabled={ratings.length === 0 || generating === key}
                          className="mt-3 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-400"
                        >
                          {generating === key
                            ? "Generating..."
                            : ratings.length === 0
                              ? "Needs feedback first"
                              : summary?.status === "GENERATED"
                                ? "Regenerate AI Summary"
                                : "Generate AI Summary"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Aggregate stats</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {stats.map((item) => (
              <div key={item.userId} className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{item.count ? `${item.average.toFixed(1)} average across ${item.count} reviews` : "No ratings yet"}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
