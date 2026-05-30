"use client";
import { useRouter } from "next/navigation";

export function LogoutButton({ label = "Switch role" }: { label?: string }) {
  const router = useRouter();

  function logout() {
    sessionStorage.removeItem("peer-feedback-user");
    router.push("/login");
  }

  return (
    <button onClick={logout} className="btn-secondary">
      {label}
    </button>
  );
}