"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get("token");
  const token = rawToken ? decodeURIComponent(rawToken) : null;
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleReset() {
    if (!token || !password) return;
    setSubmitting(true);
    try {
      await apiRequest("/auth/reset-password/", {
        method: "POST",
        body: { token, password },
      });
      setSuccess(true);
      toast.success("Password reset", "Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      toast.error(
        "Reset failed",
        err instanceof Error ? err.message : "Unable to reset password"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-950">
            Invalid link
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            No reset token was provided.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="text-center">
          {success ? (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <h1 className="mt-6 text-2xl font-semibold text-slate-950">
                Password reset
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                Your password has been reset. Redirecting to login...
              </p>
            </>
          ) : (
            <>
              <KeyRound className="mx-auto h-12 w-12 text-blue-600" />
              <h1 className="mt-6 text-2xl font-semibold text-slate-950">
                Reset your password
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                Enter a new password for your account.
              </p>
            </>
          )}
        </div>

        {!success && (
          <div className="mt-6 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              required
            />
            <button
              onClick={handleReset}
              disabled={submitting || !password}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Resetting..." : "Reset password"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <KeyRound className="mx-auto h-12 w-12 text-blue-600 animate-pulse" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-950">
            Loading...
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Preparing password reset...
          </p>
        </div>
      </main>
    }>
      <ResetPasswordPageInner />
    </Suspense>
  );
}