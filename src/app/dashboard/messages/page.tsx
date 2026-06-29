"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Send, User, Loader2 } from "lucide-react";
import { apiRequest, UserSummary } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Skeleton, SkeletonCircle } from "@/components/ui/skeleton";

type DirectMessage = {
  id: number;
  sender: UserSummary;
  recipient: UserSummary;
  body: string;
  read_at: string | null;
  created_at: string;
};

type Conversation = {
  partner: UserSummary;
  messages: DirectMessage[];
  lastMessage: DirectMessage;
};

function groupByPartner(messages: DirectMessage[], myId: number): Conversation[] {
  const map = new Map<number, { partner: UserSummary; messages: DirectMessage[] }>();

  for (const msg of messages) {
    const partner = msg.sender.id === myId ? msg.recipient : msg.sender;
    if (!map.has(partner.id)) {
      map.set(partner.id, { partner, messages: [] });
    }
    map.get(partner.id)!.messages.push(msg);
  }

  return Array.from(map.values())
    .map((c) => ({
      ...c,
      lastMessage: c.messages[c.messages.length - 1],
    }))
    .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
}

function MessagesPageInner() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const toParam = searchParams.get("to");
  const [allMessages, setAllMessages] = useState<DirectMessage[]>([]);
  const [contacts, setContacts] = useState<UserSummary[]>([]);
  const [myId, setMyId] = useState<number | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [newRecipientId, setNewRecipientId] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [msgData, authData] = await Promise.all([
        apiRequest<DirectMessage[]>("/messages/"),
        apiRequest<{ id: number; email: string; role: string }>("/authentication/"),
      ]);
      setAllMessages(msgData);
      setMyId(authData.id);
      setMyRole(authData.role);
      const contactsPath = authData.role === "counsellor" ? "/counsellor/students/" : "/counsellors/";
      const contactsData = await apiRequest<UserSummary[]>(contactsPath);
      setContacts(contactsData);
      const preselect = toParam ? Number(toParam) : null;
      if (preselect && !activePartnerId) {
        setActivePartnerId(preselect);
      } else if (msgData.length > 0 && !activePartnerId) {
        const first = msgData[0];
        const partner = first.sender.id === authData.id ? first.recipient : first.sender;
        setActivePartnerId(partner.id);
      }
    } catch (err) {
      toast.error("Failed to load messages", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, activePartnerId]);

  async function sendMessage() {
    const recipientId = showNewChat ? newRecipientId : String(activePartnerId ?? "");
    if (!recipientId || !body.trim()) return;
    setSending(true);
    try {
      await apiRequest<DirectMessage>("/messages/", {
        method: "POST",
        body: { recipient_id: Number(recipientId), body },
      });
      setBody("");
      setShowNewChat(false);
      setActivePartnerId(Number(recipientId));
      await load();
      toast.success("Message sent");
    } catch (err) {
      toast.error("Failed to send message", err instanceof Error ? err.message : undefined);
    } finally {
      setSending(false);
    }
  }

  const conversations = myId !== null ? groupByPartner(allMessages, myId) : [];
  const activeConvo = conversations.find((c) => c.partner.id === activePartnerId);
  const activeMessages = activeConvo?.messages ?? [];
  const activePartner = activeConvo?.partner ?? contacts.find((c) => c.id === activePartnerId);

  return (
<div className="mx-auto flex h-[calc(100vh-48px)] max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            {loading ? (
              <>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </>
            ) : (
              <>
                <h1 className="text-base font-semibold text-slate-950">Messages</h1>
                <button
                  type="button"
                  onClick={() => setShowNewChat(true)}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  New
                </button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="border-b border-slate-100 px-4 py-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <SkeletonCircle className="h-9 w-9" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              ))
            ) : conversations.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">
                {myRole === "counsellor"
                  ? "No messages yet. Start a conversation with a student."
                  : "No conversations yet. Start one with a counsellor."}
              </p>
            ) : (
              conversations.map((convo) => {
                const isActive = convo.partner.id === activePartnerId;
                return (
                  <button
                    key={convo.partner.id}
                    type="button"
                    onClick={() => { setActivePartnerId(convo.partner.id); setShowNewChat(false); }}
                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${isActive ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-xs font-semibold text-blue-700">
                        {convo.partner.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{convo.partner.email}</p>
                        <p className="truncate text-xs text-slate-500">{convo.lastMessage.body}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {new Date(convo.lastMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            {loading ? (
              <Skeleton className="h-5 w-40" />
            ) : showNewChat ? (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <select
                  value={newRecipientId}
                  onChange={(e) => setNewRecipientId(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    {myRole === "counsellor" ? "Select a student..." : "Select a counsellor..."}
                  </option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.email}</option>
                  ))}
                </select>
              </>
            ) : activePartner ? (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-xs font-semibold text-blue-700">
                  {activePartner.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activePartner.email}</p>
                  <p className="text-xs capitalize text-slate-500">{activePartner.role}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a conversation or start a new one</p>
            )}
          </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-5 py-4">
          {!showNewChat && activeMessages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-400">No messages in this conversation yet.</p>
            </div>
          )}
          {!showNewChat && activeMessages.map((msg) => {
            const isMe = msg.sender.id === myId;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-xs font-semibold text-blue-700">
                    {msg.sender.email[0].toUpperCase()}
                  </div>
                )}
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${isMe ? "rounded-br-sm bg-slate-900 text-white" : "rounded-bl-sm bg-white text-slate-800 shadow-sm"}`}>
                  <p>{msg.body}</p>
                  <p className={`mt-1 text-[10px] ${isMe ? "text-slate-400" : "text-slate-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isMe && msg.read_at && " ✓✓"}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {(activePartnerId !== null || showNewChat) && (
          <form
            className="flex items-end gap-3 border-t border-slate-200 p-4"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message... (Enter to send)"
              rows={1}
              className="min-w-0 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={!body.trim() || sending || (showNewChat && !newRecipientId)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-slate-500">Loading messages...</div>}>
      <MessagesPageInner />
    </Suspense>
  );
}
