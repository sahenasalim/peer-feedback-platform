"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(localStorage.getItem("peer-feedback-role") === "admin");
  }, []);

  if (allowed === null) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">Checking access...</div>;
  }

  if (!allowed) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Admin access required</h2>
        <p className="mt-2 text-slate-600">Go to the login page and continue as admin.</p>
        <Link href="/login" className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Go to login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
