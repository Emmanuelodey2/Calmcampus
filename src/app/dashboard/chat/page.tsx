"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, Send, User } from "lucide-react";
import { apiRequest } from "@/lib/api";

type ChatMessage = {
  id: number;
  sender: "user" | "ai";
  message: string;
  metadata?: { crisis?: boolean; trigger?: string };
  created_at: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function loadMessages() {
    try {
      setMessages(await apiRequest<ChatMessage[]>("/chat/"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load chat");
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const message = input.trim();
    if (!message || loading) return;

    const optimistic: ChatMessage = {
      id: Date.now(),
      sender: "user",
      message,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiRequest<{ reply: ChatMessage; crisis: boolean }>("/chat/", {
        method: "POST",
        body: { message },
      });
      setMessages((current) => [...current, data.reply]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-48px)] max-w-5xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-5 py-4">
        <h1 className="text-xl font-bold text-slate-950">Hermes AI</h1>
        <p className="text-sm text-slate-600">Personalized student support powered through the Django backend.</p>
      </header>

      {error && <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5">
        {messages.length === 0 && (
          <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Start a conversation. Hermes will use your recent mood and journal context when available.
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.sender === "user";
          return (
            <div key={message.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-[78%] rounded-md px-4 py-3 text-sm ${isUser ? "bg-blue-600 text-white" : "bg-white text-slate-800 shadow-sm"}`}>
                {message.metadata?.crisis && (
                  <div className="mb-2 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Crisis protocol activated
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-6">{message.message}</p>
                <p className={`mt-2 text-xs ${isUser ? "text-blue-100" : "text-slate-500"}`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {isUser && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-700 text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && <p className="text-sm text-slate-500">Hermes is responding...</p>}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-3 border-t border-slate-200 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your message..."
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button disabled={!input.trim() || loading} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <Send className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  );
}
