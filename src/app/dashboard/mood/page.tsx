"use client";

import { useEffect, useMemo, useState } from "react";
import { Frown, Meh, Pencil, Smile, TrendingDown, TrendingUp, X, LineChart as ChartIcon, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

type MoodEntry = {
  id: number;
  mood: string;
  intensity: number;
  description: string;
  created_at: string;
};

const moods = [
  { value: "happy", label: "Happy", icon: Smile },
  { value: "neutral", label: "Neutral", icon: Meh },
  { value: "sad", label: "Sad", icon: Frown },
  { value: "anxious", label: "Anxious", icon: TrendingDown },
  { value: "stressed", label: "Stressed", icon: TrendingUp },
];

export default function MoodPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [mood, setMood] = useState("neutral");
  const [intensity, setIntensity] = useState(5);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMood, setEditMood] = useState("neutral");
  const [editIntensity, setEditIntensity] = useState(5);
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const toast = useToast();

  async function loadMoods() {
    setLoading(true);
    try {
      setEntries(await apiRequest<MoodEntry[]>("/moods/"));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load moods");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMoods();
  }, []);

  const average = useMemo(() => {
    if (!entries.length) return 0;
    return Math.round(entries.reduce((sum, entry) => sum + entry.intensity, 0) / entries.length);
  }, [entries]);

  // Formats and sorts entries from oldest to newest for chronological left-to-right timeline tracking
  const chartData = useMemo(() => {
    return [...entries]
      .reverse()
      .map((entry) => ({
        date: new Date(entry.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        intensity: entry.intensity,
        mood: entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1),
      }));
  }, [entries]);

  async function saveMood() {
    try {
      await apiRequest<MoodEntry>("/moods/", {
        method: "POST",
        body: { mood, intensity, description },
      });
      setDescription("");
      await loadMoods();
      toast.success("Mood logged successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save mood");
    }
  }

  function startEdit(entry: MoodEntry) {
    setEditingId(entry.id);
    setEditMood(entry.mood);
    setEditIntensity(entry.intensity);
    setEditDescription(entry.description || "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    setEditLoading(true);
    try {
      await apiRequest<MoodEntry>("/moods/", {
        method: "PATCH",
        body: { id, mood: editMood, intensity: editIntensity, description: editDescription },
      });
      toast.success("Mood updated");
      cancelEdit();
      await loadMoods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update mood");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-950">Mood Tracking</h1>
        <p className="text-sm text-slate-600">Log quick check-ins and watch for changes over time.</p>
      </header>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Logging Form Container */}
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Today</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {moods.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMood(value)}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border text-sm font-medium ${
                  mood === value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          <label className="mt-6 block text-sm font-medium text-slate-700">Intensity: {intensity}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            className="mt-2 w-full"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What influenced this mood?"
            className="mt-4 min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
          />

          <button onClick={saveMood} className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Save mood
          </button>
        </div>

        {/* Analytics Summary Widget */}
        <aside className="rounded-md border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between">
          {loading ? (
            <>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-12" />
              </div>
              <Skeleton className="h-12 w-full rounded" />
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-slate-600">Average intensity</p>
                <p className="mt-2 text-5xl font-bold text-slate-950">{average || "-"}</p>
              </div>
              <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <strong>Counsellor Alert Trigger:</strong> Scores of 2 or below automatically log a system notification for student safety triage.
              </div>
            </>
          )}
        </aside>
      </section>

      {/* NEW: Mood Analytics Trend Graph section */}
      <section className="rounded-md border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <ChartIcon className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Mood Analytics Trend</h2>
        </div>
        
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-md">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-md">
            Log data points to generate your visual progress timeline.
          </div>
        ) : (
          <div className="h-64 w-full pr-4 text-xs font-medium">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis domain={[1, 10]} tickCount={10} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  formatter={(value, name, props) => [`Intensity: ${value}/10`, `Mood: ${props.payload.mood}`]}
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="#2563eb"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  dot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* History Log Feed Section */}
      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent entries</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {loading && (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[140px_100px_1fr_auto] animate-pulse">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-6 w-8 rounded" />
                </div>
              ))}
            </div>
          )}
          {!loading && entries.length === 0 && <p className="p-5 text-sm text-slate-500">No moods logged yet.</p>}
          {entries.map((entry) => (
            <div key={entry.id} className="p-5">
              {editingId === entry.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{new Date(entry.created_at).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="ml-auto rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Mood</label>
                    <select
                      value={editMood}
                      onChange={(e) => setEditMood(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    >
                      {moods.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Intensity: {editIntensity}/10</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editIntensity}
                      onChange={(e) => setEditIntensity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="What influenced this mood?"
                    className="min-h-20 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-400"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(entry.id)}
                      disabled={editLoading}
                      className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {editLoading ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-[140px_100px_1fr_auto]">
                  <span className="text-sm text-slate-500">{new Date(entry.created_at).toLocaleDateString()}</span>
                  <span className="text-sm font-semibold capitalize text-slate-900">{entry.mood}</span>
                  <span className="text-sm text-slate-700">{entry.intensity}/10 - {entry.description || "No note"}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    title="Edit mood"
                    className="self-start rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}