"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    console.log("Email:", email);

    try {
      await apiRequest("/auth/request-password-reset/", {
        method: "POST",
        body: { email },
      });
      setSent(true);
      toast.success("Reset link sent", "Check your email for the reset link.");
    } catch (err) {
      toast.error(
        "Request failed",
        err instanceof Error ? err.message : "Unable to send reset email"
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <KeyRound className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-950">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            A password reset link has been sent to {email}.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-950">
            Reset your password
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Enter your email to receive a reset link.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@pau.edu.ng"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          <Link href="/login" className="font-medium text-slate-900 underline">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
