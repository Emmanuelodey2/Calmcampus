"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useGlobalLoading } from "@/components/ui/loading-provider";

type LoginResponse = {
  message: string;
  role: "student" | "counsellor" | "admin";
  email: string;
  institution?: { id: number; name: string; slug: string } | null;
};

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { startLoading } = useGlobalLoading();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest<LoginResponse>("/auth/login/", {
        method: "POST",
        body: { email, password },
      });
      console.log("2. Login response:", data);

  toast.success("Welcome back!", "Redirecting to your workspace...");


  startLoading("Loading your workspace...");
   router.push(data.role === "admin" ? "/admin" : "/dashboard");

      // toast.success("Welcome back!", "Redirecting to your workspace...");
      // startLoading("Loading your workspace...");
      // router.push(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error("Sign in failed", err instanceof Error ? err.message : "Unable to sign in");
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
          <p className="mt-2 text-sm text-slate-500">
            <Link href="/request-reset" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4">
              Forgot password?
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
