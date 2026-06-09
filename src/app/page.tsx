import Link from "next/link";
import { ArrowRight, BrainCircuit, CalendarClock, FileText, Shield, Sparkles, Users } from "lucide-react";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: FileText,
    title: "Mood tracking",
    text: "Students log daily mood and intensity so the platform can surface patterns and support early intervention.",
  },
  {
    icon: BrainCircuit,
    title: "AI chat support",
    text: "A calm, context-aware chat experience uses mood and journal history to respond with empathy and practical guidance.",
  },
  {
    icon: Shield,
    title: "Safety first",
    text: "Keyword-based crisis detection routes high-risk conversations into a deterministic support flow and counsellor alert.",
  },
  {
    icon: Users,
    title: "Counsellor dashboard",
    text: "Counsellors can review alerts, appointments, messages, and aggregated student wellness signals in one place.",
  },
];

const workflow = [
  "Create a secure student or counsellor account.",
  "Log moods and write private journal entries.",
  "Chat with the AI assistant for support and coping steps.",
  "Escalate to a counsellor when distress is repeated or severe.",
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Calm, private, student-centred support
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 text-balance sm:text-5xl lg:text-6xl">
              CalmCampus
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 text-balance">
              An AI-assisted web platform for Pan-Atlantic University undergraduates, built to improve access to mental health support through mood tracking, journaling, safe AI chat, and counsellor escalation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950">
              Sign in
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["24/7", "Support access"],
              ["JWT", "Secure sessions"],
              ["RBAC", "Role-based access"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                <p className="text-2xl font-semibold text-slate-950">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Core modules</p>
            <div className="mt-5 space-y-4">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 text-slate-900">
                    <Icon className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h2 className="font-medium text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="h-5 w-5 text-blue-700" />
              <h3 className="mt-4 text-lg font-medium text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Workflow</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Simple by design</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              The platform follows the requirements in the project brief while keeping the interface calm and uncluttered. It is intentionally designed to feel private, steady, and easy to use on mobile or desktop.
            </p>
          </div>

          <ol className="grid gap-3">
            {workflow.map((item, index) => (
              <li key={item} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-medium text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-700">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="safety" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-r from-slate-950 to-slate-900 px-6 py-10 text-white shadow-sm sm:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-200">Safety and escalation</p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Technology supports, but does not replace, human care.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                CalmCampus keeps the system restrained: crisis words trigger a hard-coded response, counsellor alerts are raised when needed, and the AI stays within a support role.
              </p>
            </div>

            <Link href="/dashboard/counsellor" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 transition hover:bg-slate-100">
              Review alerts
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>CalmCampus for Pan-Atlantic University.</p>
          <p>Minimal interface. Private support. Clear escalation.</p>
        </div>
      </footer>
    </main>
  );
}
