"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { apiRequest, UserSummary } from "@/lib/api";

type DirectMessage = {
  id: number;
  sender: UserSummary;
  recipient: UserSummary;
  body: string;
  created_at: string;
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [counsellors, setCounsellors] = useState<UserSummary[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [messageData, counsellorData] = await Promise.all([
        apiRequest<DirectMessage[]>("/messages/"),
        apiRequest<UserSummary[]>("/counsellors/"),
      ]);
      setMessages(messageData);
      setCounsellors(counsellorData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load messages");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendMessage() {
    if (!recipientId || !body.trim()) return;
    try {
      await apiRequest<DirectMessage>("/messages/", {
        method: "POST",
        body: { recipient_id: Number(recipientId), body },
      });
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-950">Direct Messages</h1>
        <p className="text-sm text-slate-600">Secure student and counsellor communication.</p>
      </header>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MessageSquare className="h-5 w-5" />
          New message
        </h2>
        <select value={recipientId} onChange={(event) => setRecipientId(event.target.value)} className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Choose a counsellor</option>
          {counsellors.map((counsellor) => (
            <option key={counsellor.id} value={counsellor.id}>{counsellor.email}</option>
          ))}
        </select>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-3 min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm" placeholder="Write a message..." />
        <button onClick={sendMessage} className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          <Send className="h-4 w-4" />
          Send
        </button>
      </section>

      <section className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Conversation log</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {messages.length === 0 && <p className="p-5 text-sm text-slate-500">No messages yet.</p>}
          {messages.map((message) => (
            <div key={message.id} className="p-5">
              <p className="text-sm font-semibold text-slate-950">{message.sender.email} to {message.recipient.email}</p>
              <p className="mt-1 text-sm text-slate-700">{message.body}</p>
              <p className="mt-2 text-xs text-slate-500">{new Date(message.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
