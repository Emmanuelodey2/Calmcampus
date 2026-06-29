"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, BookmarkPlus, BookmarkCheck, Trash2 } from "lucide-react";
import { apiRequest, AuthUser } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

type Resource = {
  id: number;
  title: string;
  category: string;
  content: string;
  created_at: string;
};

type SavedResource = {
  id: number;
  resource: Resource;
  saved_at: string;
  notes?: string;
};

const CATEGORIES = ["stress", "anxiety", "depression", "mindfulness", "study"] as const;

const categoryColors: Record<string, string> = {
  stress: "bg-rose-100 text-rose-700 border-rose-200",
  anxiety: "bg-amber-100 text-amber-700 border-amber-200",
  depression: "bg-indigo-100 text-indigo-700 border-indigo-200",
  mindfulness: "bg-teal-100 text-teal-700 border-teal-200",
  study: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [savedResources, setSavedResources] = useState<SavedResource[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [postTitle, setPostTitle] = useState("");
  const [postCategory, setPostCategory] = useState<string>(CATEGORIES[0]);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);

  const toast = useToast();

  async function loadResources() {
    try {
      setResources(await apiRequest<Resource[]>("/resources/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load resources");
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const user = await apiRequest<AuthUser>("/authentication/");
      setRole(user.role);
      const res = await apiRequest<Resource[]>("/resources/");
      setResources(res);
      if (user.role === "student") {
        try {
          const saved = await apiRequest<SavedResource[]>("/student-resources/");
          setSavedResources(saved);
        } catch {
          // silently fail
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load resources");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePost() {
    if (!postTitle.trim() || !postContent.trim()) return;
    setPosting(true);
    try {
      await apiRequest<Resource>("/resources/", {
        method: "POST",
        body: { title: postTitle, category: postCategory, content: postContent },
      });
      toast.success("Resource posted");
      setPostTitle("");
      setPostContent("");
      setPostCategory(CATEGORIES[0]);
      await loadResources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to post resource");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await apiRequest("/resources/", {
        method: "DELETE",
        body: { id },
      });
      toast.success("Resource deleted");
      await loadResources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete resource");
    }
  }

  async function handleSave(resourceId: number) {
    try {
      await apiRequest("/student-resources/", {
        method: "POST",
        body: { id: resourceId },
      });
      toast.success("Resource saved to your collection");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save resource");
    }
  }

  const isSaved = (resourceId: number) => savedResources.some((sr) => sr.resource.id === resourceId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-950">Resources</h1>
        <p className="text-sm text-slate-600">Exercises and guidance for stress, anxiety, mindfulness, and study focus.</p>
      </header>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {role === "counsellor" && (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Plus className="h-4 w-4 text-blue-600" />
            Post New Resource
          </h2>

          <div className="mt-4 space-y-3">
            <input
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={postCategory}
              onChange={(e) => setPostCategory(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Resource content…"
              className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={handlePost}
              disabled={posting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {posting ? "Posting…" : "Post Resource"}
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <article key={i} className="relative rounded-md border border-slate-200 bg-white p-5 shadow-sm space-y-4 animate-pulse">
              <Skeleton className="h-5.5 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
              <Skeleton className="h-3 w-24" />
            </article>
          ))
        ) : resources.length === 0 ? (
          <p className="text-sm text-slate-500">No resources have been added yet.</p>
        ) : (
          resources.map((resource) => {
            return (
              <article key={resource.id} className="relative rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                    categoryColors[resource.category] ?? "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  <BookOpen className="h-3 w-3" />
                  {resource.category}
                </span>

                <h2 className="mt-3 text-lg font-bold text-slate-950">{resource.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">{resource.content}</p>
                <p className="mt-3 text-xs text-slate-400">{new Date(resource.created_at).toLocaleDateString()}</p>

                {role === "counsellor" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(resource.id)}
                    title="Delete resource"
                    className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                {role === "student" && (
                  <button
                    type="button"
                    onClick={() => handleSave(resource.id)}
                    disabled={isSaved(resource.id)}
                    className={`absolute right-4 top-4 rounded-full p-1.5 transition ${
                      isSaved(resource.id)
                        ? "text-emerald-600 cursor-default"
                        : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                    title={isSaved(resource.id) ? "Saved" : "Save to your resources"}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </button>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
