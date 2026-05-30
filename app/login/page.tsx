"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type User = {
  id: string;
  name: string;
  email: string;
};

const ADMIN_PASSWORD = "admin123";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"student" | "admin">("student");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((response) => response.json())
      .then((payload) => {
        const fetchedUsers = payload.users ?? [];
        setUsers(fetchedUsers);
        setSelectedUserId(fetchedUsers[0]?.id ?? "");
      })
      .catch(() => toast.error("Could not load students"))
      .finally(() => setLoading(false));
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "admin") {
      if (adminPassword.trim() !== ADMIN_PASSWORD) {
        toast.error("Use the demo admin password: admin123");
        return;
      }
      localStorage.setItem("peer-feedback-role", "admin");
      router.push("/admin");
      return;
    }

    const selectedUser = users.find((user) => user.id === selectedUserId);
    if (!selectedUser) {
      toast.error("Choose a student to continue");
      return;
    }

    localStorage.setItem("peer-feedback-role", "student");
    localStorage.setItem("peer-feedback-user-id", selectedUser.id);
    localStorage.setItem("peer-feedback-user-name", selectedUser.name);
    router.push(`/dashboard?userId=${selectedUser.id}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[420px,1fr]">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-8 py-10 shadow-strong text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Impressive look and feel
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-300">Peer Feedback Platform</p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">Start as a student or admin</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Students submit anonymous teammate reviews. Admins manage review forms and generate AI summaries from received feedback.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              ["Student", "Submit reviews for your teammates and follow progress."],
              ["Admin", "Create forms, monitor submissions, and generate AI summaries."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="glass-card rounded-[2rem] border border-slate-200/80 p-8">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100/90 p-1">
            <button
              type="button"
              onClick={() => setMode("student")}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${mode === "student" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${mode === "admin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}
            >
              Admin
            </button>
          </div>

          {mode === "student" ? (
            <label className="mt-8 block">
              <span className="text-sm font-medium text-slate-700">Your name</span>
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                disabled={loading}
                className="input-fancy mt-3"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="mt-8 block">
              <span className="text-sm font-medium text-slate-700">Admin password</span>
              <input
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="admin123"
                className="input-fancy mt-3"
              />
            </label>
          )}

          <button className="btn-primary mt-8 w-full">
            Continue
          </button>
        </form>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["1", "Student submits reviews", "Pick your name and review each teammate with a rating, strength, and improvement."],
          ["2", "Feedback stays anonymous", "The dashboard shows progress and summaries, not who wrote each comment."],
          ["3", "Admin generates AI summary", "After reviews are submitted, admin creates a Groq-powered summary for each student."],
        ].map(([step, title, body]) => (
          <div key={step} className="glass-card rounded-[1.75rem] border border-slate-200/70 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-800">
                {step}
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
