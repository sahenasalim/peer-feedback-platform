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

export function AdminGroupManager({
  initialGroups,
  initialUsers,
  initialForms,
}: {
  initialGroups: Group[];
  initialUsers: User[];
  initialForms: AdminForm[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [users, setUsers] = useState(initialUsers);
  const [forms, setForms] = useState(initialForms);
  const [groupName, setGroupName] = useState("");
  const [memberUserId, setMemberUserId] = useState("");
  const [memberGroupId, setMemberGroupId] = useState(initialGroups[0]?.id ?? "");
  const [formTitle, setFormTitle] = useState("");
  const [formGroupId, setFormGroupId] = useState(initialGroups[0]?.id ?? "");
  const [generating, setGenerating] = useState<string | null>(null);

  // New student registration
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

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
      average: value.ratings.length
        ? value.ratings.reduce((sum, r) => sum + r, 0) / value.ratings.length
        : 0,
      count: value.ratings.length,
    }));
  }, [forms]);

  async function createGroup() {
    if (!groupName.trim()) return toast.error("Enter a group name");
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
        group.id === memberGroupId &&
        !group.members.some((m) => m.user.id === payload.member.user.id)
          ? { ...group, members: [...group.members, { user: payload.member.user }] }
          : group,
      ),
    );
    toast.success("Member added");
  }

  async function addNewStudent() {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      return toast.error("Please fill in all fields");
    }
    setAddingStudent(true);
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, password: newPassword }),
    });
    const payload = await response.json();
    setAddingStudent(false);
    if (!response.ok) return toast.error(payload.message ?? "Unable to add student");
    setUsers((current) => [...current, payload.user]);
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    toast.success(`${payload.user.name} added successfully`);
  }

  async function createForm() {
    if (!formTitle.trim()) return toast.error("Enter a form title");
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
    setForms((current) =>
      current.map((item) =>
        item.id === form.id ? { ...item, isOpen: payload.form.isOpen } : item,
      ),
    );
    toast.success(payload.form.isOpen ? "Form opened" : "Form closed");
  }

  async function deleteForm(form: AdminForm) {
    const confirmed = window.confirm(
      `Delete "${form.title}"? This also removes its feedback submissions and AI summaries.`,
    );
    if (!confirmed) return;
    const response = await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(payload.message ?? "Unable to delete form");
    setForms((current) => current.filter((item) => item.id !== form.id));
    toast.success("Form deleted");
  }

  async function generateSummary(formId: string, targetUserId: string) {
    const key = `${formId}:${targetUserId}`;
    setGenerating(key);
    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId, targetUserId }),
    });
    const payload = await response.json().catch(() => ({}));
    setGenerating(null);
    if (!response.ok) {
      toast.error(payload.message ?? "Summary generation failed — retry");
    } else {
      toast.success("AI summary generated");
    }
    setForms((current) =>
      current.map((form) =>
        form.id === formId
          ? {
              ...form,
              summaries: [
                ...form.summaries.filter((s) => s.targetUserId !== targetUserId),
                { targetUserId, status: response.ok ? "GENERATED" : "FAILED" },
              ],
            }
          : form,
      ),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
      {/* LEFT SIDEBAR */}
      <aside className="space-y-5">

        {/* Create Group */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Create group</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. CS Group B"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <button
              onClick={createGroup}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {groups.length === 0 && (
              <p className="text-sm text-slate-500">No groups yet.</p>
            )}
            {groups.map((group) => (
              <div key={group.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{group.name}</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {group.members.length} members
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Add Member to Group */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Add member to group</h2>
          <select
            value={memberGroupId}
            onChange={(e) => setMemberGroupId(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <select
            value={memberUserId}
            onChange={(e) => setMemberUserId(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Select student</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
            ))}
          </select>
          <button
            onClick={addMember}
            disabled={!memberGroupId || !memberUserId}
            className="mt-3 w-full rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:bg-slate-300"
          >
            Add member
          </button>
        </section>

        {/* Register New Student */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Register new student</h2>
          <p className="mt-1 text-xs text-slate-500">Add a new student account to the platform.</p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name"
            className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Temporary password (share with student)"
            type="password"
            className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <button
            onClick={addNewStudent}
            disabled={addingStudent}
            className="mt-3 w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300"
          >
            {addingStudent ? "Adding..." : "Add student"}
          </button>
        </section>
      </aside>

      {/* MAIN CONTENT */}
      <main className="space-y-6">

        {/* Create Feedback Form */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Create feedback form</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr,180px,auto]">
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Sprint 2 Peer Review"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={formGroupId}
              onChange={(e) => setFormGroupId(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            <button
              onClick={createForm}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Create
            </button>
          </div>
        </section>

        {/* Feedback Forms List */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Feedback forms</h2>
          <div className="mt-4 space-y-4">
            {forms.length === 0 && (
              <p className="text-sm text-slate-500">No forms yet. Create one above.</p>
            )}
            {forms.map((form) => (
              <div key={form.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-950">{form.title}</h3>
                    <p className="text-sm text-slate-500">
                      {form.group.name}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${form.isOpen ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                        {form.isOpen ? "Open" : "Closed"}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleForm(form)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {form.isOpen ? "Close form" : "Open form"}
                    </button>
                    <button
                      onClick={() => deleteForm(form)}
                      className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {form.group.members.map(({ user }) => {
                    const ratings = form.submissions
                      .filter((s) => s.targetUserId === user.id)
                      .map((s) => s.rating);
                    const average = ratings.length
                      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                      : 0;
                    const summary = form.summaries.find((s) => s.targetUserId === user.id);
                    const key = `${form.id}:${user.id}`;
                    const hasFeedback = ratings.length > 0;

                    return (
                      <div key={user.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{ratings.length} review{ratings.length !== 1 ? "s" : ""} received</p>
                          </div>
                          {hasFeedback && <StarRating value={Math.round(average)} readOnly />}
                        </div>
                        {hasFeedback && (
                          <p className="mt-1 text-xs text-slate-500">
                            {average.toFixed(1)} average rating
                          </p>
                        )}
                        <button
                          onClick={() => generateSummary(form.id, user.id)}
                          disabled={!hasFeedback || generating === key}
                          className={`mt-3 w-full rounded-xl px-3 py-2 text-sm font-medium text-white transition ${
                            !hasFeedback
                              ? "bg-slate-300 cursor-not-allowed"
                              : summary?.status === "GENERATED"
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : summary?.status === "FAILED"
                                  ? "bg-rose-600 hover:bg-rose-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {generating === key
                            ? "Generating..."
                            : !hasFeedback
                              ? "Needs feedback first"
                              : summary?.status === "GENERATED"
                                ? "Regenerate AI summary"
                                : summary?.status === "FAILED"
                                  ? "Retry AI summary"
                                  : "Generate AI summary"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Aggregate Stats */}
        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Aggregate stats</h2>
          <p className="mt-1 text-xs text-slate-500">Average ratings across all forms per student.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {stats.length === 0 && (
              <p className="text-sm text-slate-500">No ratings yet.</p>
            )}
            {stats.map((item) => (
              <div key={item.userId} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.count ? `${item.count} review${item.count !== 1 ? "s" : ""}` : "No reviews yet"}
                  </p>
                </div>
                {item.count > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-950">{item.average.toFixed(1)}</p>
                    <StarRating value={Math.round(item.average)} readOnly />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}