"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      toast.error(payload.message ?? "Invalid email or password");
      return;
    }

    const user = payload.user;

    if (mode === "admin" && user.role !== "ADMIN") {
      toast.error("This account does not have admin access");
      return;
    }

    if (mode === "student" && user.role !== "STUDENT") {
      toast.error("Please use the admin login for this account");
      return;
    }

    // Store minimal session info
    sessionStorage.setItem("peer-feedback-user", JSON.stringify(user));

    if (user.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push(`/dashboard?userId=${user.id}`);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[420px,1fr]">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-8 py-10 shadow-strong text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Peer Feedback Platform
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-300">
            Secure Login
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
            Start as a student or admin
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Students submit anonymous teammate reviews. Admins manage review
            forms and generate AI summaries from received feedback.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              ["Student", "Submit reviews for your teammates and follow progress.", "alice@demo.com / alice123"],
              ["Admin", "Create forms, monitor submissions, and generate AI summaries.", "admin@demo.com / admin123"],
            ].map(([title, description, demo]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
                <p className="mt-2 text-xs font-mono text-emerald-400">Demo: {demo}</p>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="glass-card rounded-[2rem] border border-slate-200/80 p-8">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-slate-100/90 p-1">
            <button
              type="button"
              onClick={() => setMode("student")}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                mode === "student" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setMode("admin")}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                mode === "admin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"
              }`}
            >
              Admin
            </button>
          </div>

          <label className="mt-8 block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === "admin" ? "admin@demo.com" : "alice@demo.com"}
              className="input-fancy mt-3"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-fancy mt-3"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-8 w-full disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["1", "Student logs in", "Sign in with your email and password to access your feedback dashboard."],
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