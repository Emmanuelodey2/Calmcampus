"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, LayoutDashboard, LogOut, Settings, Shield, Sparkles } from "lucide-react";
import { apiRequest, AuthUser } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

const adminLinks = [
  { href: "/admin",           label: "System Admin",  icon: Settings },
  { href: "/dashboard",       label: "Dashboard",     icon: LayoutDashboard },
  { href: "/dashboard/chat",  label: "AI Chat",       icon: Bot },
  { href: "/dashboard/counsellor", label: "Safety View", icon: Shield },
];

export default function AdminSidebar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const toast   = useToast();
  const router  = useRouter();

  useEffect(() => {
    apiRequest<AuthUser>("/authentication/")
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    setLoading(true);
    try {
      await apiRequest("/auth/logout/", { method: "POST" });
      toast.success("Signed out", "You have been logged out successfully.");
      router.push("/login");
    } catch {
      toast.error("Logout failed", "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex items-center justify-between gap-4 lg:block">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 text-sm font-semibold text-slate-900">
            CC
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-950">CalmCampus</p>
            <p className="text-xs text-slate-500">Admin workspace</p>
          </div>
        </Link>

        {user && (
          <p className="mt-3 hidden truncate text-xs text-slate-500 lg:block">{user.email}</p>
        )}
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:flex-col lg:overflow-visible lg:pb-0">
        {adminLinks.map(({ href, label, icon: Icon }) => (
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
          Admin panel
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Manage institutions, users, and view system-wide analytics.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loading ? "Signing out..." : "Logout"}
          </button>
        </div>
      </div>
    </aside>
  );
}
