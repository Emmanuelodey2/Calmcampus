"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/api";

type Resource = {
  id: number;
  title: string;
  category: string;
  content: string;
  created_at: string;
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<Resource[]>("/resources/")
      .then(setResources)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load resources"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-950">Resources</h1>
        <p className="text-sm text-slate-600">Exercises and guidance for stress, anxiety, mindfulness, and study focus.</p>
      </header>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 md:grid-cols-2">
        {resources.length === 0 && <p className="text-sm text-slate-500">No resources have been added yet.</p>}
        {resources.map((resource) => (
          <article key={resource.id} className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
              <BookOpen className="h-4 w-4" />
              {resource.category}
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-950">{resource.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{resource.content}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
