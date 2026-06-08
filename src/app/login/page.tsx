"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, setSelectedInstitutionId } from "@/lib/api";

type LoginResponse = {
  message: string;
  role: string;
  email: string;
  institution?: { id: number } | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<LoginResponse>("/auth/login/", {
        method: "POST",
        body: { email, password },
      });

      window.localStorage.setItem("calmcampus_role", response.role);
      window.localStorage.setItem("calmcampus_email", email);
      if (response.role === "admin") {
        setSelectedInstitutionId(null);
      } else if (response.institution?.id) {
        setSelectedInstitutionId(String(response.institution.id));
      }

      const redirect = window.localStorage.getItem("redirectAfterLogin") || "/dashboard";
      window.localStorage.removeItem("redirectAfterLogin");
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <section className="space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">CalmCampus</p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 text-balance sm:text-5xl">
            Sign in to continue your support workspace.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Use the same account for mood logs, journal entries, chat support, and counsellor escalation.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            If you are in immediate danger, use local emergency services first. CalmCampus is a support tool, not emergency care.
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-950">Login</h2>
            <p className="text-sm text-slate-500">Enter your account details.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="student@pau.edu.ng"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Need an account?{" "}
            <Link href="/signup" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
