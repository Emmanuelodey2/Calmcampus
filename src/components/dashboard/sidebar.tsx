 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  Home,
  MessageSquare,
  Notebook,
  Shield,
  Smile,
  Sparkles,
  Users,
} from "lucide-react";
import LogoutButton from "./logout-button";

const links = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/journal", label: "Journal", icon: Notebook },
  { href: "/dashboard/mood", label: "Mood", icon: Smile },
  { href: "/dashboard/chat", label: "AI Chat", icon: Bot },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/counsellor", label: "Counsellor", icon: AlertTriangle },
  { href: "/dashboard/resources", label: "Resources", icon: Users },
];

export default function Sidebar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(window.localStorage.getItem("calmcampus_role") === "admin");
  }, []);

  return (
    <aside className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center justify-between gap-4 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 text-sm font-semibold text-slate-900">
            CC
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">CalmCampus</p>
            <p className="text-xs text-slate-500">Wellness workspace</p>
          </div>
        </Link>

        <div className="mt-3 flex gap-2">
          <Link
            href="/dashboard/counsellor"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            <Shield className="h-4 w-4" />
            Safety view
          </Link>
          {isAdmin ? (
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:border-blue-300"
            >
              Admin
            </Link>
          ) : null}
        </div>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-col lg:overflow-visible lg:pb-0">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-w-max items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 lg:w-full"
          >
            <Icon className="h-4 w-4 text-slate-500" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Sparkles className="h-4 w-4 text-blue-600" />
          Calm system
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Mood logging, journaling, AI guidance, and counsellor escalation in one quiet interface.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
