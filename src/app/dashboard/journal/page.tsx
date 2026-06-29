"use client";

import { useEffect, useState } from "react";
import { NotebookPen, Pencil, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

type JournalEntry = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const toast = useToast();

  async function loadEntries() {
    try {
      setEntries(await apiRequest<JournalEntry[]>("/journals/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load journal entries");
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  async function saveEntry() {
    if (!content.trim()) return;
    setLoading(true);
    setError("");

    try {
      await apiRequest<JournalEntry>("/journals/", {
        method: "POST",
        body: { title, content },
      });
      setTitle("");
      setContent("");
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save journal entry");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  }

  async function saveEdit(id: number) {
    if (!editContent.trim()) return;
    setEditLoading(true);
    try {
      await apiRequest<JournalEntry>("/journals/", {
        method: "PATCH",
        body: { id, title: editTitle, content: editContent },
      });
      toast.success("Journal updated");
      cancelEdit();
      await loadEntries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update entry");
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Journal</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Private writing space</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Use journaling to capture thoughts, patterns, and moments that matter. Entries stay tied to your account for later review and personalization.
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Plus className="h-4 w-4" />
            New entry
          </div>

          <div className="mt-5 space-y-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write freely about your day, feelings, or anything that is on your mind."
              className="min-h-72 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={saveEntry}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save entry"}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-medium text-slate-950">
              <NotebookPen className="h-4 w-4 text-blue-700" />
              Recent entries
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {initialLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))
            ) : entries.length === 0 ? (
              <p className="px-6 py-5 text-sm text-slate-500">No entries yet.</p>
            ) : (
              entries.map((entry) => (
                <article key={entry.id} className="px-6 py-4">
                  {editingId === entry.id ? (
                    <div className="space-y-3">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Content"
                        className="min-h-32 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(entry.id)}
                          disabled={editLoading}
                          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          {editLoading ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium text-slate-950">{entry.title || "Untitled entry"}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleDateString()}</span>
                          <button
                            type="button"
                            onClick={() => startEdit(entry)}
                            title="Edit entry"
                            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 max-h-24 overflow-hidden text-sm leading-6 text-slate-600">{entry.content}</p>
                    </>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
