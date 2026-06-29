"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Star, Plus, CheckCircle2, ShieldAlert, Sparkles, Filter, Trash, Loader2 } from "lucide-react";
import { apiRequest, UserSummary } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Skeleton, SkeletonText, SkeletonCircle } from "@/components/ui/skeleton";

type FeedbackEntry = {
  id: number;
  user: UserSummary;
  category: string;
  rating: number;
  comment: string;
  created_at: string;
};

const CATEGORIES = [
  { value: "bug", label: "Bug Report", color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  { value: "feature_request", label: "Feature Request", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { value: "usability", label: "Usability / Design", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
  { value: "general", label: "General Feedback", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { value: "other", label: "Other", color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100" },
];

export default function FeedbackPage() {
  const toast = useToast();
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myEmail, setMyEmail] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState("general");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // View state
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  async function loadData() {
    try {
      const [authData, feedbackData] = await Promise.all([
        apiRequest<{ role: string; email: string }>("/authentication/"),
        apiRequest<FeedbackEntry[]>("/feedback/"),
      ]);
      setMyRole(authData.role);
      setMyEmail(authData.email);
      setFeedbacks(feedbackData);

      // If counsellor or admin, show history by default
      if (authData.role === "counsellor" || authData.role === "admin") {
        setActiveTab("history");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load feedback data");
    } finally {
      setLoading(false);
    }
  }

  const loadingInitial = !myRole && !error;

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error("Please enter your comments");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await apiRequest<FeedbackEntry>("/feedback/", {
        method: "POST",
        body: { category, rating, comment },
      });
      setComment("");
      setRating(5);
      setCategory("general");
      setSuccess(true);
      toast.success("Feedback submitted successfully!");
      // Reload history
      const freshFeedbacks = await apiRequest<FeedbackEntry[]>("/feedback/");
      setFeedbacks(freshFeedbacks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
      toast.error("Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  }

  const filteredFeedbacks = feedbacks.filter((entry) => {
    if (filterCategory === "all") return true;
    return entry.category === filterCategory;
  });

  const getCategoryLabel = (val: string) => {
    return CATEGORIES.find((c) => c.value === val)?.label || val;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-3">
        {loadingInitial ? (
          <>
            <SkeletonText className="h-3 w-20" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80" />
          </>
        ) : (
          <>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Feedback</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Help Us Grow</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Your feedback is critical in shaping CalmCampus. Let us know what you like, what is broken, and what features you would love to see next.
            </p>
          </>
        )}
      </header>

      {/* Tabs */}
      {!loadingInitial && (
        <div className="flex border-b border-slate-200">
          {(myRole === "student" || !myRole) && (
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === "submit"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Submit Feedback
            </button>
          )}
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {myRole === "counsellor" || myRole === "admin" ? "All Institutional Feedback" : "My Feedback History"}
          </button>
        </div>
      )}

      {loadingInitial && <p className="text-center py-12 text-sm text-slate-400">Loading feedback settings...</p>}
      {!loadingInitial && error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

{!loadingInitial && activeTab === "submit" && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Write your feedback
            </div>

            {success && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium">Thank you for your feedback!</p>
                  <p className="mt-0.5 text-xs text-emerald-700">Our team reviews all reports to keep CalmCampus calm and reliable.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="mt-6 space-y-6">
              {/* Category Pills */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">How would you rate your experience?</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = hoverRating !== null ? star <= hoverRating : star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className="group p-1 focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 transition-all ${
                            filled
                              ? "fill-amber-400 stroke-amber-400 scale-110 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]"
                              : "stroke-slate-300 hover:stroke-slate-400 group-hover:scale-105"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-3 text-xs font-medium text-slate-500">
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </span>
                </div>
              </div>

              {/* Comments Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your comments & suggestions</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Please describe what you encountered, your suggestion, or general feedback in detail..."
                  className="min-h-40 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center w-full rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Why your voice matters
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                CalmCampus is built for students, counsellors, and administrators to facilitate stress-free, quiet, and secure mental health support.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-500 list-disc list-inside">
                <li>Bug reports are processed immediately by our developers.</li>
                <li>Feature requests go straight to our roadmap.</li>
                <li>Usability design improvements help us keep the layout serene and easy to navigate.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {!loadingInitial && activeTab === "history" && (
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-base font-medium text-slate-950">
              <MessageSquare className="h-4.5 w-4.5 text-blue-700" />
              {myRole === "counsellor" || myRole === "admin" ? "All Institutional Feedback" : "Your submitted feedback"}
            </h2>

            {/* Filter Category */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-blue-400"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredFeedbacks.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No feedback entries found matching selection.</p>
              </div>
            ) : (
              filteredFeedbacks.map((entry) => (
                <article key={entry.id} className="p-6 transition hover:bg-slate-50/50">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {getCategoryLabel(entry.category)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= entry.rating
                                  ? "fill-amber-400 stroke-amber-400"
                                  : "stroke-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">
                        Submitted by: <span className="font-medium text-slate-500">{entry.user?.email || "Anonymous"}</span> • {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{entry.comment}</p>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
