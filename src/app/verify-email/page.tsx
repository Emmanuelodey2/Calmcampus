"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

function VerifyEmailPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get("token");
  const token = rawToken ? decodeURIComponent(rawToken) : null;
  const toast = useToast();

  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token && !verifying && !success) {
      handleVerify();
    }
  }, [token]);

  async function handleVerify() {
    if (!token) return;
    setVerifying(true);
    try {
      await apiRequest("/auth/verify-email/", {
        method: "POST",
        body: { token },
      });
      setSuccess(true);
      toast.success("Email verified", "Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      toast.error(
        "Verification failed",
        err instanceof Error ? err.message : "Unable to verify email"
      );
    } finally {
      setVerifying(false);
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
            No verification token was provided.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        {success ? (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-6 text-2xl font-semibold text-slate-950">
              Email verified
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Your email has been verified. Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <Mail className="mx-auto h-12 w-12 text-blue-600" />
            <h1 className="mt-6 text-2xl font-semibold text-slate-950">
              Verify your email
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Click below to verify your email address.
            </p>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {verifying ? "Verifying..." : "Verify email"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <Mail className="mx-auto h-12 w-12 text-blue-600 animate-pulse" />
          <h1 className="mt-6 text-2xl font-semibold text-slate-950">
            Loading...
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Preparing email verification...
          </p>
        </div>
      </main>
    }>
      <VerifyEmailPageInner />
    </Suspense>
  );
}