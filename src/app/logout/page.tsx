"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function LogoutPage() {
  const toast = useToast();

  useEffect(() => {
    apiRequest("/auth/logout/", { method: "POST" })
      .then(() => toast.success("Logged out successfully"))
      .catch(() => {});
  }, [toast]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <LogOut className="mx-auto h-12 w-12 text-blue-600" />
        <h1 className="mt-6 text-2xl font-semibold text-slate-950">
          You have been logged out
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Your session has ended. Sign in again when you are ready.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <LogOut className="h-4 w-4" />
          Sign in
        </Link>
      </div>
    </main>
  );
}