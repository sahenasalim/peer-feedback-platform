"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ label = "Switch role" }: { label?: string }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("peer-feedback-role");
    localStorage.removeItem("peer-feedback-user-id");
    localStorage.removeItem("peer-feedback-user-name");
    router.push("/login");
  }

  return (
    <button onClick={logout} className="btn-secondary">
      {label}
    </button>
  );
}
