"use client";

import { useState, useEffect } from "react";

type Teacher = { name: string; title: string };

export default function ContactTeacherModal({
  childName,
  enrollmentId,
  onClose,
}: {
  childName: string;
  enrollmentId: string;
  onClose: () => void;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selected, setSelected] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/parent/teachers")
      .then(r => r.json())
      .then(d => { setTeachers(d.teachers ?? []); if (d.teachers?.length) setSelected(d.teachers[0].name); })
      .catch(() => setError("Could not load teachers."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSend() {
    if (!selected || !body.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/parent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_teacher: selected, body, child_name: childName, enrollment_id: enrollmentId }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-[#1a2035] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/8">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white text-sm">Contact a Teacher</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Regarding: {childName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="px-5 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">Message sent!</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{selected} will see your message.</p>
            <button onClick={onClose} className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Close
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Teacher selector */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 block mb-1.5">
                To
              </label>
              {loading ? (
                <div className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {teachers.map(t => (
                    <button
                      key={t.name}
                      onClick={() => setSelected(t.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all border ${
                        selected === t.name
                          ? "bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300"
                          : "border-slate-100 dark:border-white/8 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                          {t.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.title}</p>
                      </div>
                      {selected === t.name && (
                        <svg className="w-4 h-4 text-blue-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 block mb-1.5">
                Message
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your message here…"
                rows={4}
                className="w-full px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl resize-none focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <button onClick={onClose} className="flex-1 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8 rounded-xl transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !selected || !body.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
