"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle, Clock } from "lucide-react";
import { apiRequest, UserSummary } from "@/lib/api";

type Appointment = {
  id: number;
  student: UserSummary;
  counsellor: UserSummary;
  requested_for: string;
  status: string;
  reason: string;
  counsellor_note: string;
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counsellors, setCounsellors] = useState<UserSummary[]>([]);
  const [requestedFor, setRequestedFor] = useState("");
  const [reason, setReason] = useState("");
  const [counsellorId, setCounsellorId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [appointmentData, counsellorData] = await Promise.all([
        apiRequest<Appointment[]>("/appointments/"),
        apiRequest<UserSummary[]>("/counsellors/"),
      ]);
      setAppointments(appointmentData);
      setCounsellors(counsellorData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load appointments");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function requestAppointment() {
    try {
      await apiRequest<Appointment>("/appointments/", {
        method: "POST",
        body: {
          requested_for: requestedFor,
          reason,
          counsellor_id: counsellorId ? Number(counsellorId) : undefined,
        },
      });
      setRequestedFor("");
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request appointment");
    }
  }

  async function updateAppointment(id: number, status: string) {
    try {
      await apiRequest<Appointment>("/appointments/", {
        method: "PATCH",
        body: { id, status },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update appointment");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-950">Appointments</h1>
        <p className="text-sm text-slate-600">Book counsellor sessions and review pending requests.</p>
      </header>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form
          className="rounded-md border border-slate-200 bg-white p-5"
          onSubmit={(event) => {
            event.preventDefault();
            requestAppointment();
          }}
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CalendarClock className="h-5 w-5" />
            Request a session
          </h2>
          <label className="mt-4 block text-sm font-medium text-slate-700">Date and time</label>
          <input
            type="datetime-local"
            value={requestedFor}
            onChange={(event) => setRequestedFor(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <label className="mt-4 block text-sm font-medium text-slate-700">Counsellor</label>
          <select value={counsellorId} onChange={(event) => setCounsellorId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Any available counsellor</option>
            {counsellors.map((counsellor) => (
              <option key={counsellor.id} value={counsellor.id}>{counsellor.email}</option>
            ))}
          </select>
          <label className="mt-4 block text-sm font-medium text-slate-700">Reason</label>
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm" />
          <button className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Request appointment</button>
        </form>

        <div className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Schedule</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {appointments.length === 0 && <p className="p-5 text-sm text-slate-500">No appointments yet.</p>}
            {appointments.map((appointment) => (
              <div key={appointment.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold text-slate-900">{new Date(appointment.requested_for).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-600">Student: {appointment.student.email}</p>
                  <p className="text-sm text-slate-600">Counsellor: {appointment.counsellor.email}</p>
                  {appointment.reason && <p className="mt-2 text-sm text-slate-700">{appointment.reason}</p>}
                </div>
                <div className="flex items-start gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                    <Clock className="h-3 w-3" />
                    {appointment.status}
                  </span>
                  {appointment.status === "requested" && (
                    <button onClick={() => updateAppointment(appointment.id, "approved")} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                      <CheckCircle className="h-3 w-3" />
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
