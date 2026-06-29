"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function LogoutButton() {
  const router = useRouter();
  const toast  = useToast();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await apiRequest("/auth/logout/", { method: "POST" });
      toast.success("Signed out", "You have been logged out successfully.");
      router.push("/login");
    } catch {
      toast.error("Logout failed", "Please try again.");
    } finally {
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
