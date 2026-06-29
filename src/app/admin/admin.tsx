"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, RefreshCw, Shield, Users, Star, X, MessageSquare } from "lucide-react";
import { apiRequest, UserSummary } from "@/lib/api";
import { useGlobalLoading } from "@/components/ui/loading-provider";

type Institution = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
};

type FeedbackEntry = {
  id: number;
  user: UserSummary;
  category: string;
  rating: number;
  comment: string;
  created_at: string;
};

type AdminOverview = {
  selected_institution: Institution | null;
  institutions: Institution[];
  user_count: number;
  student_count: number;
  counsellor_count: number;
  mood_count: number;
  journal_count: number;
  alert_count: number;
  appointment_count: number;
  message_count: number;
  users: UserSummary[];
  feedback_count?: number;
};

type UserDraft = {
  email: string;
  password: string;
  role: "student" | "counsellor" | "admin";
  institution: string;
};

const emptyUserDraft: UserDraft = {
  email: "",
  password: "",
  role: "student",
  institution: "",
};

// ─── Per-row editor with real state ──────────────────────────────────────────

function UserRow({
  user,
  institutions,
  savingRowId,
  onSave,
}: {
  user: UserSummary;
  institutions: Institution[];
  savingRowId: number | null;
  onSave: (user: UserSummary, changes: Partial<UserSummary & { is_active: boolean }>) => void;
}) {
  const [draftRole, setDraftRole] = useState<"student" | "counsellor" | "admin">(
    (user.role as "student" | "counsellor" | "admin") ?? "student"
  );
  const [draftInstitution, setDraftInstitution] = useState(String(user.institution ?? ""));
  const [draftActive, setDraftActive] = useState(user.is_active ?? true);

  return (
    <div className="grid gap-4 px-6 py-5 lg:grid-cols-[1.1fr_0.8fr_0.8fr_auto] lg:items-center">
      <div>
        <p className="text-sm font-medium text-slate-950">{user.email}</p>
        <p className="text-xs text-slate-500">
          {user.institution_name || "No institution"} • {user.role}
        </p>
      </div>

      <select
        value={draftRole}
        onChange={(e) => setDraftRole(e.target.value as "student" | "counsellor" | "admin")}
        className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <option value="student">Student</option>
        <option value="counsellor">Counsellor</option>
        <option value="admin">Admin</option>
      </select>

      <select
        value={draftInstitution}
        onChange={(e) => setDraftInstitution(e.target.value)}
        className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">No institution</option>
        {institutions.map((inst) => (
          <option key={inst.id} value={inst.id}>
            {inst.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={draftActive}
            onChange={(e) => setDraftActive(e.target.checked)}
            className="rounded"
          />
          Active
        </label>
        <button
          type="button"
          disabled={savingRowId === user.id}
          onClick={() =>
            onSave(user, {
              role: draftRole,
              institution: draftInstitution ? Number(draftInstitution) : null,
              is_active: draftActive,
            })
          }
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingRowId === user.id ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [institutionId, setInstitutionIdState] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionSlug, setInstitutionSlug] = useState("");
  const [userDraft, setUserDraft] = useState<UserDraft>(emptyUserDraft);
  const [loading, setLoading] = useState(true);
  const [savingInstitution, setSavingInstitution] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const { stopLoading } = useGlobalLoading();
  const selectedInstitutionLabel = useMemo(() => {
    if (!institutionId) {
      return "All institutions";
    }
    return institutions.find((item) => String(item.id) === institutionId)?.name || "Selected institution";
  }, [institutionId, institutions]);

  useEffect(() => {
    void loadOverview("");
  }, []);

  async function loadOverview(selectedId?: string) {
    setLoading(true);
    setError("");

    try {
      const activeSelection = typeof selectedId !== "undefined" ? selectedId : institutionId;
      if (typeof selectedId !== "undefined") {
        setInstitutionIdState(selectedId || "");
      }
      
      const headers: Record<string, string> = {};
      if (activeSelection) {
        headers["X-Institution-ID"] = activeSelection;
      }

      const [data, feedbacksData] = await Promise.all([
        apiRequest<AdminOverview>("/admin/overview/", { headers }),
        apiRequest<FeedbackEntry[]>("/feedback/", { headers }),
      ]);

      setOverview(data);
      setUsers(data.users || []);
      setInstitutions(data.institutions || []);
      setFeedbacks(feedbacksData || []);

      if (!activeSelection && data.selected_institution) {
        setInstitutionIdState(String(data.selected_institution.id));
      }
      if (userDraft.institution === "" && (selectedId || data.selected_institution)) {
        setUserDraft((current) => ({
          ...current,
          institution: selectedId || String(data.selected_institution?.id || ""),
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin data");
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  async function handleSwitchInstitution(nextInstitutionId: string) {
    await loadOverview(nextInstitutionId);
  }

  async function handleCreateInstitution() {
    if (!institutionName.trim()) {
      setError("Institution name is required");
      return;
    }

    setSavingInstitution(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest<Institution>("/admin/institutions/", {
        method: "POST",
        body: {
          name: institutionName,
          slug: institutionSlug,
        },
      });
      setInstitutionName("");
      setInstitutionSlug("");
      await loadOverview(institutionId);
      setSuccess("Institution created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create institution");
    } finally {
      setSavingInstitution(false);
    }
  }

  async function handleCreateUser() {
    if (!userDraft.email.trim() || !userDraft.password.trim()) {
      setError("Email and password are required");
      return;
    }

    setSavingUser(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/admin/users/", {
        method: "POST",
        body: {
          email: userDraft.email,
          password: userDraft.password,
          role: userDraft.role,
          institution: userDraft.institution || undefined,
        },
      });
      setUserDraft({
        ...emptyUserDraft,
        institution: userDraft.institution || institutionId || "",
      });
      await loadOverview(institutionId);
      setSuccess("User created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    } finally {
      setSavingUser(false);
    }
  }

  async function handleUpdateUser(user: UserSummary, changes: Partial<UserSummary & { is_active: boolean }>) {
    setSavingRowId(user.id);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/admin/users/", {
        method: "PATCH",
        body: {
          id: user.id,
          ...changes,
          institution: changes.institution ?? user.institution ?? undefined,
        },
      });
      await loadOverview(institutionId);
      setSuccess(`Updated ${user.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user");
    } finally {
      setSavingRowId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              System administration
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Institution management and user control.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Switch between schools, create institutions, add users, and keep the platform scoped to the selected tenant.
            </p>
          </div>

          <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Selected scope</p>
            <select
              value={institutionId}
              onChange={(event) => void handleSwitchInstitution(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All institutions</option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">{selectedInstitutionLabel}</p>
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Users", value: overview?.user_count ?? 0 },
            { label: "Students", value: overview?.student_count ?? 0 },
            { label: "Counsellors", value: overview?.counsellor_count ?? 0 },
            { label: "Alerts", value: overview?.alert_count ?? 0 },
            { label: "Feedbacks", value: overview?.feedback_count ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Building2 className="h-4 w-4 text-blue-700" />
            Institutions
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              value={institutionName}
              onChange={(event) => setInstitutionName(event.target.value)}
              placeholder="Institution name"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={institutionSlug}
              onChange={(event) => setInstitutionSlug(event.target.value)}
              placeholder="Slug, optional"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleCreateInstitution()}
            disabled={savingInstitution}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {savingInstitution ? "Creating..." : "Create institution"}
          </button>

          <div className="mt-6 space-y-3">
            {institutions.length === 0 ? (
              <p className="text-sm text-slate-500">No institutions yet.</p>
            ) : (
              institutions.map((institution) => (
                <div key={institution.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950">{institution.name}</p>
                      <p className="text-xs text-slate-500">/{institution.slug}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${institution.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {institution.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4 text-blue-700" />
            Add user
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              value={userDraft.email}
              onChange={(event) => setUserDraft((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <input
              value={userDraft.password}
              onChange={(event) => setUserDraft((current) => ({ ...current, password: event.target.value }))}
              placeholder="Temporary password"
              type="password"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={userDraft.role}
              onChange={(event) => setUserDraft((current) => ({ ...current, role: event.target.value as UserDraft["role"] }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="student">Student</option>
              <option value="counsellor">Counsellor</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={userDraft.institution}
              onChange={(event) => setUserDraft((current) => ({ ...current, institution: event.target.value }))}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Use selected scope</option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void handleCreateUser()}
            disabled={savingUser}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {savingUser ? "Creating..." : "Create user"}
          </button>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Create users in the active institution, or leave the institution blank for admin accounts.
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-medium text-slate-950">Users</h2>
            <p className="text-sm text-slate-500">Edit user role, active status, and institution.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadOverview(institutionId)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <p className="px-6 py-5 text-sm text-slate-500">Loading admin data...</p>
          ) : users.length === 0 ? (
            <p className="px-6 py-5 text-sm text-slate-500">No users found for this scope.</p>
          ) : (
            users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                institutions={institutions}
                savingRowId={savingRowId}
                onSave={(u, changes) => void handleUpdateUser(u, changes)}
              />
            ))
          )}
        </div>
      </section>

      {/* Feedbacks Section in Tabular Form */}
      <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-medium text-slate-950">User Feedbacks</h2>
            <p className="text-sm text-slate-500">View student app experience, ratings, and comments.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-center">Rating</th>
                <th className="px-6 py-3.5">Comment Snippet</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-5 text-sm text-slate-500 text-center">Loading feedback data...</td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-sm text-slate-500 text-center">
                    <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    No feedback entries found.
                  </td>
                </tr>
              ) : (
                feedbacks.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedFeedback(item)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 truncate max-w-[200px]">
                      {item.user?.email || "Anonymous"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 capitalize">
                        {item.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= item.rating ? "fill-amber-400 stroke-amber-400" : "stroke-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[250px]">
                      {item.comment}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedFeedback(item)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Feedback Details Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 capitalize">
                  {selectedFeedback.category.replace("_", " ")}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">Feedback Details</h3>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Submitted By</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{selectedFeedback.user?.email || "Anonymous"}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rating</p>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4.5 w-4.5 ${
                        star <= selectedFeedback.rating ? "fill-amber-400 stroke-amber-400" : "stroke-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date Submitted</p>
                <p className="mt-1 text-sm text-slate-700">{new Date(selectedFeedback.created_at).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Comment</p>
                <p className="mt-1.5 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {selectedFeedback.comment}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
