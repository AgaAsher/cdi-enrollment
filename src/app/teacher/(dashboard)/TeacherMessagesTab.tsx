"use client";

import { useState, useEffect } from "react";

type Message = {
  id: string;
  created_at: string;
  parent_name: string;
  child_name: string;
  body: string;
  read_at: string | null;
};

export default function TeacherMessagesTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/messages")
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await fetch("/api/teacher/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read_at: new Date().toISOString() } : m));
  }

  const unread = messages.filter(m => !m.read_at).length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-16 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0f1f6b] dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-16 text-center">
        <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No messages yet</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Messages from parents will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          <span className="font-semibold text-blue-600 dark:text-blue-400">{unread}</span> unread message{unread !== 1 ? "s" : ""}
        </p>
      )}
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`bg-white dark:bg-[#1a2035] rounded-2xl border p-5 transition-all ${
            !msg.read_at
              ? "border-blue-200 dark:border-blue-500/30 shadow-sm"
              : "border-slate-200 dark:border-white/10"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-500/20">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  {msg.parent_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{msg.parent_name}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Re: {msg.child_name} · {new Date(msg.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!msg.read_at && <span className="w-2 h-2 rounded-full bg-blue-500" />}
              {!msg.read_at && (
                <button
                  onClick={() => markRead(msg.id)}
                  className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-12">{msg.body}</p>
        </div>
      ))}
    </div>
  );
}
