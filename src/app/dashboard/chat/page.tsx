"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, Plus, Send, User } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

type ChatMessage = {
  id: number;
  sender: "user" | "ai";
  message: string;
  metadata?: { crisis?: boolean; trigger?: string };
  created_at: string;
};

const FALLBACK_PREFIX = "Thank you for telling me";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  async function loadMessages() {
    try {
      setMessages(await apiRequest<ChatMessage[]>("/chat/"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load chat";
      toast.error("Failed to load chat", message);
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startNewChat() {
    if (clearingChat) return;
    setClearingChat(true);
    try {
      await apiRequest("/chat/", {
        method: "POST",
        body: { clear_context: true },
      });
      setMessages([]);
      toast.info("New chat started", "Your previous session has been cleared.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start a new chat";
      toast.error("Failed to clear chat", message);
    } finally {
      setClearingChat(false);
    }
  }

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

      // Detect fallback response (Gemini unavailable)
      if (data.reply.message.startsWith(FALLBACK_PREFIX)) {
        toast.warning(
          "AI is temporarily unavailable",
          "Your message was received. Please try again shortly.",
        );
      }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "";

      // Detect token / quota errors
      if (/token|quota/i.test(errMessage)) {
        toast.error(
          "AI token limit reached",
          "The AI service has reached its usage limit. Please try again later.",
        );
        return;
      }

      // Detect network / fetch failures
      if (
        errMessage.toLowerCase().includes("fetch") ||
        errMessage.toLowerCase().includes("network") ||
        errMessage.toLowerCase().includes("failed to fetch")
      ) {
        toast.error(
          "Connection failed",
          "Could not reach the server. Check your internet connection.",
        );
        return;
      }

      // Generic fallback
      toast.error("Message failed", errMessage || "Unable to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-48px)] max-w-5xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-end border-b border-slate-100 bg-slate-50 px-5 py-2">
        <button
          onClick={startNewChat}
          disabled={clearingChat}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          {clearingChat ? "Clearing..." : "New Chat"}
        </button>
      </div>

      <header className="border-b border-slate-200 px-5 py-4">
        <h1 className="text-xl font-bold text-slate-950">Hermes AI</h1>
        <p className="text-sm text-slate-600">Personalized student support powered through the Django backend.</p>
      </header>

<div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5">
         {initialLoading ? (
           [
             { isUser: false, width: "w-3/4" },
             { isUser: true, width: "w-1/2" },
             { isUser: false, width: "w-2/3" },
           ].map((item, index) => (
             <div key={index} className={`flex gap-3 ${item.isUser ? "justify-end" : "justify-start"} animate-pulse`}>
               {!item.isUser && (
                 <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
               )}
               <div className={`max-w-[78%] rounded-md px-4 py-3 text-sm space-y-2 bg-white shadow-sm ${item.width}`}>
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-5/6" />
                 <Skeleton className="h-3 w-12 mt-2" />
               </div>
               {item.isUser && (
                 <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
               )}
             </div>
           ))
         ) : messages.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Start a conversation. Hermes will use your recent mood and journal context when available.
          </div>
        ) : (
          messages.map((message) => {
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
          })
        )}

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
