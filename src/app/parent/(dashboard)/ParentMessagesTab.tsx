"use client";

import { useState, useEffect } from "react";

type ParentMessage = {
  id: string;
  created_at: string;
  child_name: string;
  to_teacher: string;
  body: string;
  teacher_reply: string | null;
  replied_at: string | null;
};

export default function ParentMessagesTab() {
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/messages")
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-16 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No messages yet</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Use the "Contact Teacher" button on your child's card to send a message.</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-3">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`rounded-2xl border overflow-hidden ${
            msg.teacher_reply
              ? "border-emerald-200 dark:border-emerald-500/25"
              : "border-slate-200 dark:border-white/8"
          }`}
        >
          {/* Parent message */}
          <div className="px-5 py-4 bg-white dark:bg-[#131d30]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  To: {msg.to_teacher}
                </span>
                <span className="text-slate-300 dark:text-white/15">·</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{msg.child_name}</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {new Date(msg.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{msg.body}</p>
          </div>

          {/* Teacher reply */}
          {msg.teacher_reply ? (
            <div className="px-5 py-4 bg-emerald-50/60 dark:bg-emerald-500/8 border-t border-emerald-100 dark:border-emerald-500/20">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {msg.to_teacher} replied
                  {msg.replied_at && (
                    <span className="font-normal text-emerald-600/70 dark:text-emerald-500 ml-1">
                      · {new Date(msg.replied_at).toLocaleDateString("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{msg.teacher_reply}</p>
            </div>
          ) : (
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-white/3 border-t border-slate-100 dark:border-white/5">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                Waiting for reply
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
