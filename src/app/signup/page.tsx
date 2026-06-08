"use client";

 import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type Institution = {
  id: number;
  name: string;
  slug: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "counsellor">("student");
  const [institutionId, setInstitutionId] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Institution[]>("/institutions/")
      .then((items) => {
        setInstitutions(items);
        if (items.length === 1) {
          setInstitutionId(String(items[0].id));
        }
      })
      .catch(() => setInstitutions([]))
      .finally(() => setLoadingInstitutions(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiRequest("/auth/signup/", {
        method: "POST",
        body: { email, password, role, institution_id: institutionId || undefined },
      });
      router.push("/Login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
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
            Create a calm, secure account for support.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Choose student or counsellor access. The platform keeps permissions separated so sensitive data stays role-based and private.
          </p>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Designed for Pan-Atlantic University undergraduates, with journaling, mood history, AI chat, and counsellor intervention.
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-950">Sign up</h2>
            <p className="text-sm text-slate-500">Create your CalmCampus account.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="student@pau.edu.ng"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as "student" | "counsellor")}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="student">Student</option>
                <option value="counsellor">Counsellor</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="institution">Institution</label>
              <select
                id="institution"
                value={institutionId}
                onChange={(event) => setInstitutionId(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                required
                disabled={loadingInstitutions}
              >
                <option value="">{loadingInstitutions ? "Loading institutions..." : "Select an institution"}</option>
                {institutions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/Login" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-4">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
