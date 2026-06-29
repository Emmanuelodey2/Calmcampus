"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  FileText,
  MessageSquare,
  Notebook,
  Shield,
  Smile,
  Sparkles,
} from "lucide-react";
import { apiRequest, UserSummary } from "@/lib/api";
import { useGlobalLoading } from "@/components/ui/loading-provider";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardData = {
  user: UserSummary;
  moods: { id: number; mood: string; intensity: number; created_at: string }[];
  journals: { id: number | string; title: string; created_at: string }[];
  open_alerts: number;
};

const actions = [
  { href: "/dashboard/chat", label: "Talk to AI", icon: Bot, description: "Supportive chat with safety checks." },
  { href: "/dashboard/journal", label: "Write journal", icon: Notebook, description: "Private reflective writing." },
  { href: "/dashboard/mood", label: "Log mood", icon: Smile, description: "Quick daily check-in." },
  { href: "/dashboard/appointments", label: "Book session", icon: CalendarClock, description: "Connect with a counsellor." },
  { href: "/dashboard/messages", label: "Direct message", icon: MessageSquare, description: "Secure communication with staff." },
  { href: "/dashboard/resources", label: "Resources", icon: FileText, description: "Practical self-help material." },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const { stopLoading } = useGlobalLoading();
  
  useEffect(() => {
    apiRequest<DashboardData>("/dashboard/")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load dashboard"))
      .finally(() => stopLoading());
  }, [stopLoading]);

  const latestMood = useMemo(() => data?.moods?.[0], [data]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              CalmCampus dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {data === null && !error ? (
                <span className="inline-flex items-center gap-2">
                  Welcome<Skeleton className="h-8 w-44" />.
                </span>
              ) : (
                `Welcome${data?.user.email ? `, ${data.user.email}` : ""}.`
              )}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              This workspace keeps the core requirements visible in one place: mood tracking, journaling, AI support, counsellor intervention, appointments, and resources.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {data === null && !error ? (
              <Skeleton className="h-9 w-32 rounded-full" />
            ) : data?.open_alerts ? (
              <Link href="/dashboard/counsellor" className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
                <AlertTriangle className="h-4 w-4" />
                {data.open_alerts} open alert{data.open_alerts === 1 ? "" : "s"}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <Shield className="h-4 w-4" />
                No open alerts
              </span>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data === null && !error ? (
            ["Latest mood", "Journal entries", "Open alerts", "Role"].map((label) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{label}</p>
                <Skeleton className="mt-2 h-7 w-28" />
              </div>
            ))
          ) : (
            [
              { label: "Latest mood", value: latestMood ? `${latestMood.mood} / ${latestMood.intensity}/10` : "No mood yet" },
              { label: "Journal entries", value: String(data?.journals.length ?? 0) },
              { label: "Open alerts", value: String(data?.open_alerts ?? 0) },
              { label: "Role", value: data?.user.role ?? "student" },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actions.map(({ href, label, icon: Icon, description }) => (
          <Link key={href} href={href} className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50">
                <Icon className="h-5 w-5 text-blue-700" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-600" />
            </div>
            <h2 className="mt-5 text-lg font-medium text-slate-950">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-medium text-slate-950">Recent moods</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data === null && !error ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))
            ) : data?.moods?.length === 0 ? (
              <p className="px-6 py-5 text-sm text-slate-500">No mood entries yet.</p>
            ) : (
              data?.moods?.map((mood) => (
                <div key={mood.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium capitalize text-slate-950">{mood.mood}</p>
                    <p className="text-sm text-slate-500">{new Date(mood.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{mood.intensity}/10</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-medium text-slate-950">Recent journals</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data === null && !error ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            ) : data?.journals?.length === 0 ? (
              <p className="px-6 py-5 text-sm text-slate-500">No journal entries yet.</p>
            ) : (
              data?.journals?.map((journal) => (
                <div key={journal.id} className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-950">{journal.title || "Untitled entry"}</p>
                  <p className="mt-1 text-sm text-slate-500">{new Date(journal.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
