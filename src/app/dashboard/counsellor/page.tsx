"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  ShieldCheck,
  Users,
  CalendarDays,
  BookOpen,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Circle,
  X,
  Sparkles,
  Heart,
  Activity,
  Brain,
  Shield,
  User,
  FileText,
  Scale,
  Ruler,
} from "lucide-react";
import { apiRequest, UserSummary } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

// ─────────────────────────── Types ───────────────────────────

type CrisisAlert = {
  id: number;
  user: UserSummary;
  counsellor: UserSummary | null;
  trigger: string;
  source: string;
  status: string;
  notes: string;
  created_at: string;
};

type MoodEntry = {
  mood: string;
  intensity: number;
  created_at: string;
};

type StudentSummary = {
  id: number;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  mental_health_issues?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  current_medication?: string;
  has_previous_therapy?: boolean;
  reason_for_seeking_help?: string;
  anonymous_to_counsellor?: boolean;
  last_mood?: MoodEntry | null;
  mood_count?: number;
  appointment_count?: number;
  open_alerts_count?: number;
};

type Appointment = {
  id: number;
  student: UserSummary;
  counsellor: UserSummary;
  requested_for: string;
  status: "requested" | "approved" | "rescheduled" | "cancelled";
  reason: string;
};

type Resource = {
  id: number;
  title: string;
  category: string;
  content: string;
  created_at?: string;
};

type CaseFileData = {
  student: UserSummary & {
    phone: string;
    address: string;
    city: string;
    mental_health_issues: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    medical_history: string | null;
    current_medication: string | null;
    has_previous_therapy: boolean;
    reason_for_seeking_help: string | null;
    anonymous_to_counsellor: boolean;
    age: number | null;
    weight: number | null;
    height: number | null;
    ai_comments: string | null;
  };
  moods: { id: number; mood: string; intensity: number; description: string; created_at: string }[];
  journals: { id: number | string; title: string; content: string; created_at: string }[];
  notes: { id: number; content: string; created_at: string }[];
};

type DashboardData = {
  students: StudentSummary[];
  open_alerts: CrisisAlert[];
  appointments: Appointment[];
  resources: Resource[];
  stats: {
    unread_messages: number;
    notifications: number;
    open_alerts: number;
    pending_appointments: number;
    total_students: number;
  };
};

// ─────────────────────────── Helpers ───────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function alertBorderColor(source: string) {
  if (source === "crisis") return "border-l-red-500";
  if (source === "mood_pattern") return "border-l-amber-500";
  return "border-l-orange-400";
}

function alertBadgeColor(source: string) {
  if (source === "crisis") return "bg-red-100 text-red-700";
  if (source === "mood_pattern") return "bg-amber-100 text-amber-700";
  return "bg-orange-100 text-orange-700";
}

function alertIconColor(source: string) {
  if (source === "crisis") return "text-red-500";
  if (source === "mood_pattern") return "text-amber-500";
  return "text-orange-400";
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-xl p-2 ${color}`}>{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

const appointmentStatusConfig: Record<
  string,
  { label: string; classes: string }
> = {
  requested: { label: "Requested", classes: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Approved", classes: "bg-emerald-100 text-emerald-700" },
  rescheduled: { label: "Rescheduled", classes: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelled", classes: "bg-slate-100 text-slate-600" },
};

const moodDotColor: Record<string, string> = {
  happy: "bg-emerald-400",
  calm: "bg-blue-400",
  neutral: "bg-slate-400",
  sad: "bg-indigo-400",
  anxious: "bg-amber-400",
  angry: "bg-red-400",
  stressed: "bg-orange-400",
};

// ─────────────────────────── Sub-components ───────────────────────────

function Spinner() {
  return (
    <Loader2 className="h-5 w-5 animate-spin text-blue-500" aria-hidden />
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <article
          key={i}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 border-l-4 border-l-slate-200 bg-white p-5 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-4 w-4 rounded-full bg-slate-200 shrink-0" />
              <div className="h-4 w-36 rounded bg-slate-200" />
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-200 shrink-0" />
          </div>

          {/* Trigger */}
          <div className="space-y-2 py-1">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50 mt-1">
            <div className="h-3.5 w-24 rounded bg-slate-100" />
            <div className="h-4 w-12 rounded bg-slate-100" />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <div className="h-8.5 flex-1 rounded-xl bg-slate-100" />
            <div className="h-8.5 flex-1 rounded-xl bg-slate-200" />
          </div>
        </article>
      ))}
    </div>
  );
}

// ─────────────────────────── Tab: Overview ───────────────────────────

function OverviewTab({
  stats,
  recentAlerts,
  upcomingAppointments,
}: {
  stats: DashboardData["stats"];
  recentAlerts: CrisisAlert[];
  upcomingAppointments: Appointment[];
}) {
  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unread Messages"
          value={stats.unread_messages}
          icon={<MessageSquare className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Notifications"
          value={stats.notifications}
          icon={<Bell className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Open Alerts"
          value={stats.open_alerts}
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          color="bg-red-50"
        />
        <StatCard
          label="Pending Appointments"
          value={stats.pending_appointments}
          icon={<CalendarDays className="h-5 w-5 text-amber-600" />}
          color="bg-amber-50"
        />
      </div>

      {/* Recent alerts */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent Alerts</h2>
        </div>
        {recentAlerts.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No open alerts.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{alert.user.email}</p>
                  <p className="text-xs text-slate-500 truncate">{alert.trigger}</p>
                </div>
                <span className={`ml-4 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${alertBadgeColor(alert.source)}`}>
                  {alert.source.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming appointments */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Upcoming Appointments</h2>
        </div>
        {upcomingAppointments.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No upcoming appointments.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingAppointments.map((appt) => {
              const cfg = appointmentStatusConfig[appt.status] ?? appointmentStatusConfig.requested;
              return (
                <div key={appt.id} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{appt.student.email}</p>
                    <p className="text-xs text-slate-500">{fmtDate(appt.requested_for)}</p>
                  </div>
                  <span className={`ml-4 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cfg.classes}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
// ─────────────────────────── Tab: Alerts ───────────────────────────

function AlertsTab({
  alerts,
  onUpdate,
}: {
  alerts: CrisisAlert[];
  onUpdate: (id: number, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState<Set<number>>(new Set());

  async function handleUpdate(id: number, status: string) {
    setUpdating((prev) => new Set(prev).add(id));
    await onUpdate(id, status);
    setUpdating((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
        <ShieldCheck className="h-10 w-10 text-emerald-400" />
        <p className="text-sm font-medium">No open alerts — all clear!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {alerts.map((alert) => (
        <article
          key={alert.id}
          className={`flex flex-col gap-3 rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${alertBorderColor(alert.source)}`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle
                className={`h-4 w-4 shrink-0 ${alertIconColor(alert.source)}`}
              />
              <p className="truncate text-sm font-semibold text-slate-900">
                {alert.user.email}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${alertBadgeColor(alert.source)}`}
            >
              {alert.source.replace("_", " ")}
            </span>
          </div>

          {/* Trigger */}
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 line-clamp-3">
            {alert.trigger}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="h-3 w-3" />
              {fmtDate(alert.created_at)}
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
                alert.status === "resolved"
                  ? "bg-emerald-50 text-emerald-600"
                  : alert.status === "reviewing"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {alert.status}
            </span>
          </div>

          {/* Actions */}
          {alert.status !== "resolved" && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleUpdate(alert.id, "reviewing")}
                disabled={
                  updating.has(alert.id) || alert.status === "reviewing"
                }
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                {updating.has(alert.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
                Mark Reviewing
              </button>
              <button
                onClick={() => handleUpdate(alert.id, "resolved")}
                disabled={updating.has(alert.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {updating.has(alert.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
                Resolve
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

// ─────────────────────────── Tab: Students ───────────────────────────

// ─────────────────────────── Tab: Students ───────────────────────────

function StudentsTab({
  students,
  resources,
  onResourceAssign,
  onViewCaseFile,
}: {
  students: StudentSummary[];
  resources: Resource[];
  onResourceAssign: (studentId: number, resourceId: number) => Promise<void>;
  onViewCaseFile: (studentId: number) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [assigningResource, setAssigningResource] = useState<{ student_id: number; resource_id: string } | null>(null);

  function toggleRow(id: number) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  async function handleAssignResource(studentId: number, resourceId: string) {
    if (!resourceId) return;
    setAssigningResource({ student_id: studentId, resource_id: resourceId });
    try {
      await onResourceAssign(studentId, Number(resourceId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign resource");
    } finally {
      setAssigningResource(null);
    }
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
        <Users className="h-10 w-10" />
        <p className="text-sm font-medium">No students assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-3.5">Email</th>
            <th className="px-5 py-3.5 hidden md:table-cell">Last Mood</th>
            <th className="px-5 py-3.5 hidden lg:table-cell text-center">
              Mood Entries
            </th>
            <th className="px-5 py-3.5 hidden lg:table-cell text-center">
              Appointments
            </th>
            <th className="px-5 py-3.5 text-center">Open Alerts</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.map((student) => {
            const isExpanded = expanded === student.id;
            const dotColor =
              moodDotColor[student.last_mood?.mood ?? ""] ?? "bg-slate-300";

            return (
              <>
                <tr
                  key={student.id}
                  onClick={() => toggleRow(student.id)}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                      <span className="font-medium text-slate-900 truncate max-w-[180px]">
                        {student.email}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 hidden md:table-cell">
                    {student.last_mood ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${dotColor} shrink-0`}
                        />
                        <span className="capitalize text-slate-700">
                          {student.last_mood.mood}
                        </span>
                        <span className="text-slate-400">
                          {student.last_mood.intensity}/10
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4 hidden lg:table-cell text-center text-slate-600">
                    {student.mood_count ?? 0}
                  </td>

                  <td className="px-5 py-4 hidden lg:table-cell text-center text-slate-600">
                    {student.appointment_count ?? 0}
                  </td>

                  <td className="px-5 py-4 text-center">
                    {(student.open_alerts_count ?? 0) > 0 ? (
                      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                        {student.open_alerts_count}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">0</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onViewCaseFile(student.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Case File
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/messages?to=${student.id}`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Message
                      </button>
                    </div>
                  </td>
                </tr>

                {isExpanded && (
                  <tr key={`${student.id}-expanded`} className="bg-slate-50/50">
                    <td colSpan={6} className="px-8 py-6">
                      <div className="space-y-6">
                        {/* Upper row: basic metrics */}
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              Student Identity
                            </p>
                            <p className="text-sm font-bold text-slate-900">
                              #{student.id}
                            </p>
                            {student.anonymous_to_counsellor && (
                              <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                Anonymous Mode Active
                              </span>
                            )}
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              Last Mood
                            </p>
                            {student.last_mood ? (
                              <div className="flex items-center gap-2">
                                <Circle
                                  className={`h-3 w-3 fill-current ${dotColor.replace("bg-", "text-")}`}
                                />
                                <span className="text-sm font-medium capitalize text-slate-800">
                                  {student.last_mood.mood} —{" "}
                                  {student.last_mood.intensity}/10
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-400">No data</p>
                            )}
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              Activity
                            </p>
                            <p className="text-sm text-slate-700">
                              <span className="font-semibold">
                                {student.mood_count ?? 0}
                              </span>{" "}
                              moods ·{" "}
                              <span className="font-semibold">
                                {student.appointment_count ?? 0}
                              </span>{" "}
                              appointments
                            </p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              Assign Resource
                            </p>
                            <select
                              onChange={(e) => handleAssignResource(student.id, e.target.value)}
                              disabled={assigningResource?.student_id === student.id}
                              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm bg-white"
                              defaultValue=""
                            >
                              <option value="">Select a resource...</option>
                              {resources.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Intake form & Mental wellness details */}
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                              Clinical Intake & Wellness
                            </h4>
                            
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mental Health Issues / Struggles</p>
                              <p className="mt-1 text-xs text-slate-705 text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {student.mental_health_issues || "No issues reported."}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Reason for seeking support</p>
                              <p className="mt-1 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {student.reason_for_seeking_help || "No reason specified."}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700">
                              <span className="font-semibold">Previous Therapy:</span>
                              <span>{student.has_previous_therapy ? "Yes, has attended sessions before" : "No prior therapy history"}</span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                              Medical, Location & Contacts
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Medical History</p>
                                <p className="mt-1 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {student.medical_history || "No medical conditions reported."}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Medications</p>
                                <p className="mt-1 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {student.current_medication || "No medications reported."}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Contact Details</p>
                                <p className="mt-1 text-xs text-slate-700">
                                  <span className="font-semibold">Phone:</span> {student.phone || "—"}<br />
                                  <span className="font-semibold">Location:</span> {student.city ? `${student.city}, ${student.address || ""}` : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Emergency Contact</p>
                                <p className="mt-1 text-xs text-slate-700">
                                  <span className="font-semibold">Name:</span> {student.emergency_contact_name || "—"}<br />
                                  <span className="font-semibold">Phone:</span> {student.emergency_contact_phone || "—"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────── Tab: Notes ───────────────────────────

function NotesTab({
  students,
  toast,
}: {
  students: StudentSummary[];
  toast: any;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (selectedStudentId) {
      fetchNotes();
    } else {
      setNotes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]);

  async function fetchNotes() {
    setLoadingNotes(true);
    try {
      const data = await apiRequest<any[]>(`/counsellor/notes/?student_id=${selectedStudentId}`);
      setNotes(data);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoadingNotes(false);
    }
  }

  async function handleSaveNote() {
    if (!newNoteContent.trim()) return;
    setSavingNote(true);
    try {
      await apiRequest("/counsellor/notes/", {
        method: "POST",
        body: { student_id: Number(selectedStudentId), content: newNoteContent.trim() },
      });
      toast.success("Note saved successfully");
      setNewNoteContent("");
      fetchNotes();
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDeleteNote(id: number) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await apiRequest(`/counsellor/notes/`, {
        method: "DELETE",
        body: { id },
      });
      toast.success("Note deleted");
      fetchNotes();
    } catch {
      toast.error("Failed to delete note");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Supervision Notes Journal</h3>
        <div className="max-w-md">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Select Student</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
          >
            <option value="">Choose a student to write about...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStudentId && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Editor */}
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Add Note/Comment</h4>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write observations, recommendations, or journal comments about this student..."
                rows={8}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote || !newNoteContent.trim()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Note
              </button>
            </div>
          </div>

          {/* Past Notes */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[300px]">
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Past Supervision Notes</h4>
              {loadingNotes ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">No notes recorded for this student yet.</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 relative group hover:shadow-sm transition">
                      <p className="text-[10px] text-slate-400 mb-1">{fmtDate(note.created_at)}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Component: CaseFileDrawer ───────────────────────────

function CaseFileDrawer({
  caseFile,
  loading,
  onClose,
  generatingAiComments,
  onGenerateAiComments,
  onSaveNote,
  toast,
}: {
  caseFile: CaseFileData | null;
  loading: boolean;
  onClose: () => void;
  generatingAiComments: boolean;
  onGenerateAiComments: (studentId: number) => Promise<void>;
  onSaveNote: (studentId: number, content: string) => Promise<void>;
  toast: any;
}) {
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "moods" | "journals" | "ai" | "notes">("profile");
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in animate-duration-200">
        {/* Click outside backdrop to close */}
        <div className="flex-1" onClick={onClose} />
        
        {/* Drawer Body */}
        <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl relative z-10 animate-pulse">
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
            <div className="space-y-2">
              <div className="h-6 w-44 rounded bg-slate-200" />
              <div className="h-3 w-60 rounded bg-slate-100" />
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Buttons Skeleton */}
          <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 overflow-x-auto gap-2 py-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-24 rounded bg-slate-200 shrink-0" />
            ))}
          </div>

          {/* Content Area Skeleton */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Vital physical metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
                  <div className="h-3.5 w-12 rounded bg-slate-200" />
                  <div className="h-7 w-24 rounded bg-slate-300" />
                </div>
              ))}
            </div>

            {/* Intake & Wellness Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="h-5 w-48 rounded bg-slate-200 mb-2" />
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-28 rounded bg-slate-200" />
                    <div className="h-4.5 w-full rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="h-5 w-36 rounded bg-slate-200 mb-2" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-32 rounded bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="h-4 w-32 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseFile) return null;

  const { student, moods, journals, notes } = caseFile;

  async function handleAddNote() {
    if (!noteContent.trim()) return;
    setSavingNote(true);
    try {
      await onSaveNote(student.id, noteContent.trim());
      setNoteContent("");
    } catch {
      // handled by parent toast
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in animate-duration-200">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />
      
      {/* Drawer Body */}
      <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl transition-transform duration-300 ease-out transform translate-x-0 relative z-10">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Student Case File</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{student.email}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 overflow-x-auto gap-1">
          {[
            { id: "profile", label: "Wellness Profile", icon: <User className="h-4 w-4" /> },
            { id: "moods", label: "Mood Logs", icon: <Activity className="h-4 w-4" /> },
            { id: "journals", label: "Journals", icon: <FileText className="h-4 w-4" /> },
            { id: "ai", label: "AI Analysis", icon: <Sparkles className="h-4 w-4" /> },
            { id: "notes", label: "Counsellor Notes", icon: <BookOpen className="h-4 w-4" /> },
          ].map((t) => {
            const active = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id as any)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSubTab === "profile" && (
            <div className="space-y-6">
              {/* Vital physical metrics */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Age</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{student.age !== null ? `${student.age} years` : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Scale className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Weight</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{student.weight !== null ? `${student.weight} kg` : "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Ruler className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Height</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{student.height !== null ? `${student.height} cm` : "—"}</p>
                </div>
              </div>

              {/* Intake & Wellness Info */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Heart className="h-4.5 w-4.5 text-red-500" />
                  Wellness & Clinical Details
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mental Health Issues</h4>
                    <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed">{student.mental_health_issues || "None declared."}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medical History</h4>
                    <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed">{student.medical_history || "None declared."}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Medication</h4>
                    <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed">{student.current_medication || "None declared."}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Previous Therapy</h4>
                    <p className="text-sm text-slate-800 mt-1 font-semibold">{student.has_previous_therapy ? "Yes" : "No"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason for Seeking Help</h4>
                    <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed">{student.reason_for_seeking_help || "Not specified."}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center gap-2">
                  <Shield className="h-4.5 w-4.5 text-blue-500" />
                  Emergency Contact
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Name</span>
                    <span className="text-sm font-medium text-slate-800">{student.emergency_contact_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Phone</span>
                    <span className="text-sm font-medium text-slate-800">{student.emergency_contact_phone || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "moods" && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-blue-500" />
                Mood Log History
              </h3>
              {moods.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">No mood logs logged yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  {moods.map((m) => {
                    const dotColor = moodDotColor[m.mood] ?? "bg-slate-300";
                    return (
                      <div key={m.id} className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                            <span className="font-semibold capitalize text-slate-900">{m.mood}</span>
                            <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Intensity: {m.intensity}/10</span>
                          </div>
                          {m.description && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{m.description}</p>}
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 font-medium">{fmtDate(m.created_at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSubTab === "journals" && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                Student Journal Entries
              </h3>
              {journals.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12">No journal entries written yet.</p>
              ) : (
                <div className="space-y-4">
                  {journals.map((j) => (
                    <div key={j.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                      <div className="flex justify-between items-start gap-2 mb-2 border-b border-slate-50 pb-2">
                        <h4 className="font-bold text-slate-900 leading-snug">{j.title || "Untitled Entry"}</h4>
                        <span className="text-xs text-slate-400 shrink-0 font-medium">{fmtDate(j.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{j.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === "ai" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                  AI Wellness Analysis
                </h3>
                <button
                  onClick={() => onGenerateAiComments(student.id)}
                  disabled={generatingAiComments}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {generatingAiComments ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {generatingAiComments ? "Running Analysis..." : "Generate AI Analysis"}
                </button>
              </div>

              <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/40 to-indigo-50/10 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-purple-800">
                  <Brain className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Psychologist Insights & Comments</span>
                </div>
                {student.ai_comments ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-purple-50 rounded-xl p-4 shadow-sm">
                    {student.ai_comments}
                  </p>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 font-semibold">No wellness analysis available for this student yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Click the button above to run an AI analysis based on their chat history, moods, and journals.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSubTab === "notes" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Quick Note Editor */}
              <div className="lg:col-span-1 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Case Note</h4>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Record student progress, session details, or guidelines..."
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
                />
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !noteContent.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Note
                </button>
              </div>

              {/* Note Logs */}
              <div className="lg:col-span-2 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Note History</h4>
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6">No supervision notes recorded yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {notes.map((n) => (
                      <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-[10px] text-slate-400 mb-1">{fmtDate(n.created_at)}</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function AppointmentsTab({
  appointments,
  students,
  onAppointmentRequest,
}: {
  appointments: Appointment[];
  students: StudentSummary[];
  onAppointmentRequest: (studentId: number, requestedFor: string, reason: string) => Promise<void>;
}) {
  const [studentId, setStudentId] = useState("");
  const [requestedFor, setRequestedFor] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;
    setSubmitting(true);
    try {
      await onAppointmentRequest(Number(studentId), requestedFor, reason);
      setStudentId("");
      setRequestedFor("");
      setReason("");
    } catch {
      // handled by parent toast
    } finally {
      setSubmitting(false);
    }
  }

  if (appointments.length === 0 && !students.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
        <CalendarDays className="h-10 w-10" />
        <p className="text-sm font-medium">No appointments scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
          <PlusCircle className="h-5 w-5 text-blue-600" />
          Request appointment with student
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Student</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2">
              <option value="">Select a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Date and time</label>
            <input type="datetime-local" value={requestedFor} onChange={(e) => setRequestedFor(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Reason</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={submitting || !studentId} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            {submitting ? "Requesting..." : "Request appointment"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Schedule</h2>
        </div>
        {appointments.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No appointments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5 hidden sm:table-cell">Requested For</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((appt) => {
                const cfg = appointmentStatusConfig[appt.status] ?? appointmentStatusConfig.requested;
                const StatusIcon = appt.status === "approved" ? CheckCircle2 : appt.status === "cancelled" ? XCircle : appt.status === "rescheduled" ? RefreshCw : Clock;
                return (
                  <tr key={appt.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900 truncate max-w-[160px]">{appt.student.email}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-slate-600">{fmtDate(appt.requested_for)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.classes}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-slate-500 max-w-[240px] truncate">{appt.reason || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── Tab: Resources ───────────────────────────

const RESOURCE_CATEGORIES = [
  { value: "stress", label: "Stress" },
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "study", label: "Study" },
];

const categoryColors: Record<string, string> = {
  stress: "bg-orange-100 text-orange-700",
  anxiety: "bg-amber-100 text-amber-700",
  depression: "bg-indigo-100 text-indigo-700",
  mindfulness: "bg-emerald-100 text-emerald-700",
  study: "bg-blue-100 text-blue-700",
};

function ResourcesTab({
  resources,
  onRefresh,
}: {
  resources: Resource[];
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("stress");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.warning("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/resources/", {
        method: "POST",
        body: { title: title.trim(), category, content: content.trim() },
      });
      toast.success("Resource posted");
      setTitle("");
      setContent("");
      setCategory("stress");
      onRefresh();
    } catch (err) {
      toast.error(
        "Failed to post resource",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await apiRequest("/resources/", { method: "DELETE", body: { id } });
      toast.success("Resource deleted");
      onRefresh();
    } catch (err) {
      toast.error(
        "Failed to delete",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Post form */}
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-900">
            Post New Resource
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="res-title"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Title
              </label>
              <input
                id="res-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resource title…"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="res-category"
                className="mb-1.5 block text-xs font-semibold text-slate-600"
              >
                Category
              </label>
              <select
                id="res-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="res-content"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Content
            </label>
            <textarea
              id="res-content"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your resource content here…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              {submitting ? "Posting…" : "Post Resource"}
            </button>
          </div>
        </form>
      </section>

      {/* Existing resources */}
      {resources.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <BookOpen className="h-10 w-10" />
          <p className="text-sm font-medium">No resources posted yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {resources.map((res) => (
            <article
              key={res.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900 leading-snug line-clamp-2">
                  {res.title}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                    categoryColors[res.category] ??
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {res.category}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 line-clamp-4">
                {res.content}
              </p>
              <div className="mt-auto flex justify-end pt-1">
                <button
                  onClick={() => handleDelete(res.id)}
                  disabled={deletingId === res.id}
                  className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === res.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Main Page ───────────────────────────

type TabId = "overview" | "alerts" | "students" | "appointments" | "resources" | "notes";

export default function CounsellorDashboardPage() {
  const toast = useToast();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("alerts");
  
  // Case file states
  const [viewingCaseFileId, setViewingCaseFileId] = useState<number | null>(null);
  const [caseFile, setCaseFile] = useState<CaseFileData | null>(null);
  const [loadingCaseFile, setLoadingCaseFile] = useState(false);
  const [generatingAiComments, setGeneratingAiComments] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await apiRequest<DashboardData>("/counsellor/");
      setDashboard(data);
    } catch (err) {
      toast.error(
        "Failed to load dashboard",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCaseFile(studentId: number) {
    setViewingCaseFileId(studentId);
    setLoadingCaseFile(true);
    try {
      const data = await apiRequest<CaseFileData>(`/counsellor/students/${studentId}/`);
      setCaseFile(data);
    } catch {
      toast.error("Failed to load student case file");
    } finally {
      setLoadingCaseFile(false);
    }
  }

  async function handleGenerateAiComments(studentId: number) {
    setGeneratingAiComments(true);
    try {
      const data = await apiRequest<CaseFileData>(`/counsellor/students/${studentId}/`, {
        method: "POST",
        body: { generate_ai_analysis: true },
      });
      setCaseFile(data);
      toast.success("AI wellness comments generated successfully!");
      await loadDashboard();
    } catch {
      toast.error("Failed to generate AI comments");
    } finally {
      setGeneratingAiComments(false);
    }
  }

  async function handleSaveNoteFromCaseFile(studentId: number, content: string) {
    await apiRequest("/counsellor/notes/", {
      method: "POST",
      body: { student_id: studentId, content },
    });
    // Refresh case file notes list
    const data = await apiRequest<CaseFileData>(`/counsellor/students/${studentId}/`);
    setCaseFile(data);
  }

  async function handleAlertUpdate(id: number, status: string) {
    try {
      await apiRequest("/crisis-alerts/", {
        method: "PATCH",
        body: { id, status },
      });
      toast.success(
        status === "resolved" ? "Alert resolved" : "Alert marked as reviewing"
      );
      await loadDashboard();
    } catch (err) {
      toast.error(
        "Failed to update alert",
        err instanceof Error ? err.message : undefined
      );
    }
  }

  async function handleAssignResource(studentId: number, resourceId: number) {
    try {
      await apiRequest("/student-resources/", {
        method: "POST",
        body: { id: resourceId },
      });
      toast.success("Resource assigned to student");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign resource");
    }
  }

  async function handleAppointmentRequest(studentId: number, requestedFor: string, reason: string) {
    await apiRequest("/appointments/", {
      method: "POST",
      body: { student_id: studentId, requested_for: requestedFor, reason },
    });
    toast.success("Appointment requested");
    await loadDashboard();
  }

  const openAlertsCount = dashboard?.open_alerts.length ?? 0;
  const stats = dashboard?.stats;

  const tabs: {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: <AlertTriangle className="h-4 w-4" />,
      badge: stats && stats.open_alerts > 0 ? stats.open_alerts : undefined,
    },
    {
      id: "students",
      label: "Students",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "notes",
      label: "Counsellor Notes",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: <CalendarDays className="h-4 w-4" />,
      badge: stats && stats.pending_appointments > 0 ? stats.pending_appointments : undefined,
    },
    {
      id: "resources",
      label: "Resources",
      icon: <BookOpen className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Counsellor Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor student wellbeing, manage alerts, appointments, and
            resources.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          disabled={loading}
          className="mt-3 sm:mt-0 flex items-center gap-2 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {/* Tab bar */}
      <nav
        className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-1.5"
        aria-label="Dashboard tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content area */}
      <main>
        {loading ? (
          <LoadingState />
        ) : !dashboard ? (
          <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
            <AlertTriangle className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium">
              Could not load dashboard data. Please refresh.
            </p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && <OverviewTab stats={dashboard.stats} recentAlerts={dashboard.open_alerts.slice(0, 5)} upcomingAppointments={dashboard.appointments.slice(0, 5)} />}
            {activeTab === "alerts" && (
              <AlertsTab
                alerts={dashboard.open_alerts}
                onUpdate={handleAlertUpdate}
              />
            )}
            {activeTab === "students" && (
              <StudentsTab
                students={dashboard.students}
                resources={dashboard.resources}
                onResourceAssign={handleAssignResource}
                onViewCaseFile={loadCaseFile}
              />
            )}
            {activeTab === "notes" && (
              <NotesTab
                students={dashboard.students}
                toast={toast}
              />
            )}
            {activeTab === "appointments" && (
              <AppointmentsTab appointments={dashboard.appointments} students={dashboard.students} onAppointmentRequest={handleAppointmentRequest} />
            )}
            {activeTab === "resources" && (
              <ResourcesTab
                resources={dashboard.resources}
                onRefresh={loadDashboard}
              />
            )}
          </>
        )}
      </main>

      {/* Case File Drawer Panel */}
      {viewingCaseFileId && (
        <CaseFileDrawer
          caseFile={caseFile}
          loading={loadingCaseFile}
          onClose={() => {
            setViewingCaseFileId(null);
            setCaseFile(null);
          }}
          generatingAiComments={generatingAiComments}
          onGenerateAiComments={handleGenerateAiComments}
          onSaveNote={handleSaveNoteFromCaseFile}
          toast={toast}
        />
      )}
    </div>
  );
}
