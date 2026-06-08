"use client";

import { useEffect, useMemo, useState } from "react";
import { Frown, Meh, Smile, TrendingDown, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/api";

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

  async function saveMood() {
    try {
      await apiRequest<MoodEntry>("/moods/", {
        method: "POST",
        body: { mood, intensity, description },
      });
      setDescription("");
      await loadMoods();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save mood");
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

        <aside className="rounded-md border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-600">Average intensity</p>
          <p className="mt-2 text-5xl font-bold text-slate-950">{average || "-"}</p>
          <p className="mt-3 text-sm text-slate-600">Scores of 2 or below create a counsellor alert for review.</p>
        </aside>
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Recent entries</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {loading && <p className="p-5 text-sm text-slate-500">Loading moods...</p>}
          {!loading && entries.length === 0 && <p className="p-5 text-sm text-slate-500">No moods logged yet.</p>}
          {entries.map((entry) => (
            <div key={entry.id} className="grid gap-2 p-5 sm:grid-cols-[140px_100px_1fr]">
              <span className="text-sm text-slate-500">{new Date(entry.created_at).toLocaleDateString()}</span>
              <span className="text-sm font-semibold capitalize text-slate-900">{entry.mood}</span>
              <span className="text-sm text-slate-700">{entry.intensity}/10 - {entry.description || "No note"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
