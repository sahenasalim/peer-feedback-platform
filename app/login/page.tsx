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

        {/* Left panel */}
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 px-8 py-10 shadow-strong text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Peer Feedback Platform
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-300">
            Secure Login
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
            Anonymous feedback that drives growth
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Students submit honest peer reviews anonymously. Admins manage
            review cycles and generate AI-powered summaries for every student.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              ["Student", "Submit anonymous reviews for your teammates and track your progress."],
              ["Admin", "Create forms, monitor submissions, and generate AI summaries."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Right panel — form */}
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
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              className="input-fancy mt-3"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-8 w-full disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Continue →"}
          </button>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5 border border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              What happens next
            </p>
            <div className="space-y-3">
              {mode === "student" ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">1</span>
                    <p className="text-sm text-slate-600">See your assigned feedback forms</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">2</span>
                    <p className="text-sm text-slate-600">Submit anonymous reviews for each teammate</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">3</span>
                    <p className="text-sm text-slate-600">View your AI-generated feedback summary</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">1</span>
                    <p className="text-sm text-slate-600">Create groups and add students</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">2</span>
                    <p className="text-sm text-slate-600">Create and manage feedback forms</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">3</span>
                    <p className="text-sm text-slate-600">Generate AI summaries for each student</p>
                  </div>
                </>
              )}
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
              Need access? Contact your administrator.
            </p>
          </div>
        </form>
      </div>

      {/* Bottom steps */}
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["1", "Log in securely", "Sign in with your email and password to access your personalised dashboard."],
          ["2", "Feedback stays anonymous", "Reviews are stored securely. Peers never see who wrote what."],
          ["3", "AI does the heavy lifting", "After reviews are submitted, Groq generates a structured summary with actionable advice."],
        ].map(([step, title, body]) => (
          <div key={step} className="glass-card card-hover rounded-[1.75rem] border border-slate-200/70 p-6">
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