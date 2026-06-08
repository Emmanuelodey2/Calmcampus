"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, RefreshCw, Shield, Users } from "lucide-react";
import { apiRequest, getSelectedInstitutionId, setSelectedInstitutionId, UserSummary } from "@/lib/api";

type Institution = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
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
  const selectedInstitutionLabel = useMemo(() => {
    if (!institutionId) {
      return "All institutions";
    }
    return institutions.find((item) => String(item.id) === institutionId)?.name || "Selected institution";
  }, [institutionId, institutions]);

  useEffect(() => {
    const storedInstitution = getSelectedInstitutionId();
    if (storedInstitution) {
      setInstitutionIdState(storedInstitution);
    }
    void loadOverview(storedInstitution || "");
  }, []);

  async function loadOverview(selectedId?: string) {
    setLoading(true);
    setError("");

    try {
      if (typeof selectedId !== "undefined") {
        setSelectedInstitutionId(selectedId || null);
        setInstitutionIdState(selectedId || "");
      }
      const data = await apiRequest<AdminOverview>("/admin/overview/");
      setOverview(data);
      setUsers(data.users || []);
      setInstitutions(data.institutions || []);
      const activeSelection = selectedId || getSelectedInstitutionId() || "";
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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Users", value: overview?.user_count ?? 0 },
            { label: "Students", value: overview?.student_count ?? 0 },
            { label: "Counsellors", value: overview?.counsellor_count ?? 0 },
            { label: "Alerts", value: overview?.alert_count ?? 0 },
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
            users.map((user) => {
              const [draftRole, setDraftRole] = [user.role, user.role];
              const [draftInstitution, setDraftInstitution] = [String(user.institution || ""), String(user.institution || "")];
              const [draftActive, setDraftActive] = [true, true];

              return (
                <div key={user.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[1.1fr_0.8fr_0.8fr_auto] lg:items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{user.email}</p>
                    <p className="text-xs text-slate-500">
                      {user.institution_name || "No institution"} • {user.role}
                    </p>
                  </div>

                  <select
                    value={draftRole}
                    onChange={() => setDraftRole}
                    className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="student">Student</option>
                    <option value="counsellor">Counsellor</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={draftInstitution}
                    onChange={() => setDraftInstitution}
                    className="rounded-2xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">No institution</option>
                    {institutions.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={savingRowId === user.id}
                    onClick={() =>
                      void handleUpdateUser(user, {
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
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
