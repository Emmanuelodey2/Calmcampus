"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { apiRequest, setSelectedInstitutionId } from "@/lib/api";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await apiRequest("/auth/logout/", { method: "POST" });
    } finally {
      setSelectedInstitutionId(null);
      window.localStorage.removeItem("calmcampus_role");
      window.localStorage.removeItem("calmcampus_email");
      router.push("/Login");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out..." : "Logout"}
    </button>
  );
}
