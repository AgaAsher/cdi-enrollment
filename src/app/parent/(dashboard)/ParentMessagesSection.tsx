"use client";

import { useState, useEffect } from "react";

type ParentMessage = {
  id: string;
  created_at: string;
  to_teacher: string;
  body: string;
  teacher_reply: string | null;
  replied_at: string | null;
  enrollment_id: string;
};

export default function ParentMessagesSection({ enrollmentId }: { enrollmentId: string }) {
  const [messages, setMessages] = useState<ParentMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parent/messages")
      .then(r => r.json())
      .then(d => {
        const all: ParentMessage[] = d.messages ?? [];
        setMessages(all.filter(m => m.enrollment_id === enrollmentId));
      })
      .finally(() => setLoading(false));
  }, [enrollmentId]);

  if (loading || messages.length === 0) return null;

  const hasNewReply = messages.some(m => m.teacher_reply && m.replied_at);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Messages
        </p>
        {hasNewReply && (
          <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
            Reply received
          </span>
        )}
      </div>
      <div className="space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`rounded-xl border overflow-hidden ${
              msg.teacher_reply
                ? "border-emerald-200 dark:border-emerald-500/25"
                : "border-slate-100 dark:border-white/6"
            }`}
          >
            {/* Parent message */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-white/4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  To: {msg.to_teacher}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(msg.created_at).toLocaleDateString("en", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{msg.body}</p>
            </div>

            {/* Teacher reply */}
            {msg.teacher_reply && (
              <div className="px-4 py-3 bg-emerald-50/60 dark:bg-emerald-500/8 border-t border-emerald-100 dark:border-emerald-500/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            )}

            {/* Waiting state */}
            {!msg.teacher_reply && (
              <div className="px-4 py-2 bg-white dark:bg-white/2 border-t border-slate-100 dark:border-white/5">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  Waiting for reply
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
