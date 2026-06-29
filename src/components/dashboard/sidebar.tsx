"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Bot,
  CalendarClock,
  Check,
  Home,
  MessageSquare,
  Notebook,
  Shield,
  Smile,
  Sparkles,
  Users,
  Star,
  User,
} from "lucide-react";
import LogoutButton from "./logout-button";
import { apiRequest, AuthUser, UserSummary } from "@/lib/api";

type Notification = {
  id: number;
  actor: UserSummary;
  verb: string;
  description: string;
  read: boolean;
  created_at: string;
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function verbLabel(verb: string) {
  if (verb === "appointment_requested") return "Appointment requested";
  if (verb === "appointment_approved") return "Appointment approved";
  return verb.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const studentLinks = [
  { href: "/dashboard",              label: "Overview",    icon: Home },
  { href: "/dashboard/profile",      label: "Wellness Profile", icon: User },
  { href: "/dashboard/journal",      label: "Journal",     icon: Notebook },
  { href: "/dashboard/mood",         label: "Mood",        icon: Smile },
  { href: "/dashboard/chat",         label: "AI Chat",     icon: Bot },
  { href: "/dashboard/appointments", label: "Appointments",icon: CalendarClock },
  { href: "/dashboard/messages",     label: "Messages",    icon: MessageSquare },
  { href: "/dashboard/resources",    label: "Resources",   icon: Users },
  { href: "/dashboard/feedback",     label: "Feedback",    icon: Star },
];

const counsellorLinks = [
  { href: "/dashboard",              label: "Overview",          icon: Home },
  { href: "/dashboard/counsellor",   label: "Counsellor Panel",  icon: Shield },
  { href: "/dashboard/chat",         label: "AI Chat",           icon: Bot },
  { href: "/dashboard/messages",     label: "Messages",          icon: MessageSquare },
  { href: "/dashboard/appointments", label: "Appointments",      icon: CalendarClock },
  { href: "/dashboard/resources",    label: "Resources",         icon: Users },
  { href: "/dashboard/feedback",     label: "Feedback",          icon: Star },
];

export default function Sidebar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiRequest<AuthUser>("/authentication/")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function loadCount() {
      try {
        const data = await apiRequest<{ unread_count: number }>("/notifications/count/");
        if (active) setUnreadCount(data.unread_count);
      } catch {
        // ignore
      }
    }

    loadCount();
    const interval = setInterval(loadCount, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!showNotif || !user) return;
    let active = true;

    async function loadNotifications() {
      try {
        const data = await apiRequest<Notification[]>("/notifications/");
        if (active) setNotifications(data.slice(0, 10));
      } catch {
        // ignore
      }
    }

    loadNotifications();
    return () => {
      active = false;
    };
  }, [showNotif, user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkRead() {
    try {
      await apiRequest("/notifications/mark-read/", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  }

  const isCounsellor = user?.role === "counsellor";
  const isAdmin      = user?.role === "admin";
  const links        = isCounsellor ? counsellorLinks : studentLinks;

  return (
    <aside className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center justify-between gap-4 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 text-sm font-semibold text-slate-900">
            CC
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">CalmCampus</p>
            <p className="text-xs text-slate-500">
              {isCounsellor ? "Counsellor workspace" : isAdmin ? "Admin workspace" : "Wellness workspace"}
            </p>
          </div>
        </Link>

        {user && (
          <p className="mt-2 hidden truncate text-xs text-slate-500 lg:block">{user.email}</p>
        )}

        {isAdmin && (
          <div className="mt-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:border-blue-300"
            >
              Admin Panel
            </Link>
          </div>
        )}
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
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotif((v) => !v)}
            className="inline-flex min-w-max items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950 lg:w-full"
          >
            <Bell className="h-4 w-4 text-slate-500" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl lg:right-4">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkRead}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`border-b border-slate-50 px-4 py-3 transition hover:bg-slate-50 ${n.read ? "opacity-70" : "bg-blue-50/40"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900">{verbLabel(n.verb)}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-600">{n.description}</p>
                          <p className="mt-1 text-[10px] text-slate-400">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Sparkles className="h-4 w-4 text-blue-600" />
          {isCounsellor ? "Support centre" : "Calm system"}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isCounsellor
            ? "Monitor student wellbeing, manage alerts, and post resources."
            : "Mood logging, journaling, AI guidance, and counsellor escalation in one quiet interface."}
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
