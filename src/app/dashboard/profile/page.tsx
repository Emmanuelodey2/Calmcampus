"use client";

import { useEffect, useState } from "react";
import { User, ShieldAlert, CheckCircle2, Loader2, Sparkles, Phone, MapPin, HeartPulse, UserCheck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Skeleton, SkeletonText, SkeletonCircle } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const toast = useToast();
  
  // Profile state
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  
  // Wellness Intake fields
  const [mentalHealthIssues, setMentalHealthIssues] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [currentMedication, setCurrentMedication] = useState("");
  const [hasPreviousTherapy, setHasPreviousTherapy] = useState(false);
  const [reasonForSeekingHelp, setReasonForSeekingHelp] = useState("");
  const [anonymousToCounsellor, setAnonymousToCounsellor] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest<any>("/profile/");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setMentalHealthIssues(data.mental_health_issues || "");
        setEmergencyContactName(data.emergency_contact_name || "");
        setEmergencyContactPhone(data.emergency_contact_phone || "");
        setMedicalHistory(data.medical_history || "");
        setCurrentMedication(data.current_medication || "");
        setHasPreviousTherapy(data.has_previous_therapy || false);
        setReasonForSeekingHelp(data.reason_for_seeking_help || "");
        setAnonymousToCounsellor(data.anonymous_to_counsellor || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load wellness profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await apiRequest("/profile/", {
        method: "PATCH",
        body: {
          phone,
          address,
          city,
          mental_health_issues: mentalHealthIssues,
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
          medical_history: medicalHistory,
          current_medication: currentMedication,
          has_previous_therapy: hasPreviousTherapy,
          reason_for_seeking_help: reasonForSeekingHelp,
          anonymous_to_counsellor: anonymousToCounsellor,
        },
      });
      setSuccess(true);
      toast.success("Wellness profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save wellness profile");
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Settings</p>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </header>

        <div className="space-y-8">
          {[1, 2, 3, 4].map((section) => (
            <div key={section} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6 animate-pulse">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <SkeletonCircle className="h-5 w-5" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <SkeletonText className="h-3 w-24" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Wellness Intake Profile</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          This intake profile helps counsellors understand your mental wellness background and clinical needs before any session.
        </p>
      </header>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-medium">Profile successfully updated</p>
            <p className="mt-0.5 text-xs text-emerald-700">Your counsellor will review this intake data upon booking an appointment.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Anonymity Section */}
        <div className="rounded-[2rem] border border-blue-200 bg-blue-50/30 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl space-y-1">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Counsellor Anonymity Mode
              </h2>
              <p className="text-xs leading-relaxed text-slate-600">
                When activated, counsellors cannot see your email, phone, address, or emergency contacts. They will only see your wellness intake details, mood logs, journals, and a system-assigned student number.
              </p>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymousToCounsellor}
                  onChange={(e) => setAnonymousToCounsellor(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {anonymousToCounsellor ? "Anonymous" : "Public"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Contact Info (will be hidden to counsellor if anonymous is True) */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            <Phone className="h-5 w-5 text-blue-600" />
            Contact & Location Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lagos"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. PAU Hall 1"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-blue-600" />
            Emergency Contact Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Next of kin or guardian name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contact Phone</label>
              <input
                type="text"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="Emergency phone number"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Clinical Intake Information */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
            <HeartPulse className="h-5 w-5 text-blue-600" />
            Clinical Intake Information
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mental Health History / Current Issues</label>
            <p className="text-xs text-slate-500">Please detail any current mental health struggles (e.g. stress, anxiety, depression, insomnia) and relevant history.</p>
            <textarea
              value={mentalHealthIssues}
              onChange={(e) => setMentalHealthIssues(e.target.value)}
              placeholder="Describe any current struggles or diagnostic history..."
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Medical History</label>
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="List any physical illnesses, allergies, or pre-existing medical conditions..."
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Medications</label>
              <textarea
                value={currentMedication}
                onChange={(e) => setCurrentMedication(e.target.value)}
                placeholder="List any prescription medications, dosages, or wellness supplements..."
                className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4">
            <input
              type="checkbox"
              id="has_previous_therapy"
              checked={hasPreviousTherapy}
              onChange={(e) => setHasPreviousTherapy(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="has_previous_therapy" className="text-xs font-semibold text-slate-700 cursor-pointer">
              I have previously attended therapy or professional counselling sessions.
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reason for Seeking Support</label>
            <p className="text-xs text-slate-500">What specific challenges or goals do you wish to work through in CalmCampus counselling?</p>
            <textarea
              value={reasonForSeekingHelp}
              onChange={(e) => setReasonForSeekingHelp(e.target.value)}
              placeholder="State what you hope to address or gain from your sessions..."
              className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 transition focus:border-blue-400 focus:ring-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving changes..." : "Save Wellness Intake"}
        </button>
      </form>
    </div>
  );
}
