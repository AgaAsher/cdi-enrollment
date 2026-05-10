"use client";

import { useState, useEffect } from "react";

type Student = { id: string; name: string };

type FeedbackEntry = {
  id: string;
  enrollment_id: string;
  teacher_name: string;
  class_label: string;
  category: string;
  content: string;
  created_at: string;
};

const CATEGORIES = [
  { key: "academic",  label: "Academic",  color: "blue"   },
  { key: "behavior",  label: "Behavior",  color: "amber"  },
  { key: "social",    label: "Social",    color: "violet" },
  { key: "health",    label: "Health",    color: "green"  },
  { key: "general",   label: "General",   color: "slate"  },
];

const CAT_COLORS: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  amber:  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  green:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  slate:  "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-400",
};

function catColor(cat: string) {
  const c = CATEGORIES.find(c => c.key === cat);
  return c ? CAT_COLORS[c.color] : CAT_COLORS.slate;
}
function catLabel(cat: string) {
  return CATEGORIES.find(c => c.key === cat)?.label ?? cat;
}
function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export default function TeacherFeedbackTab({ classes }: { classes: string[] }) {
  const [selectedClass, setSelectedClass] = useState<string>(classes[0] ?? "");
  const [students, setStudents] = useState<Student[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newCategory, setNewCategory] = useState("general");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    setStudents([]);
    setSelectedStudent(null);
    setFeedback([]);

    Promise.all([
      fetch(`/api/teacher/students?class=${encodeURIComponent(selectedClass)}`).then(r => r.json()),
      fetch(`/api/teacher/feedback?class=${encodeURIComponent(selectedClass)}`).then(r => r.json()),
    ]).then(([sd, fd]) => {
      setStudents(sd.students ?? []);
      setFeedback(fd.feedback ?? []);
      setLoadingStudents(false);
    });
  }, [selectedClass]);

  const feedbackFor = (id: string) => feedback.filter(f => f.enrollment_id === id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !newContent.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/teacher/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enrollment_id: selectedStudent.id,
        class_label: selectedClass,
        category: newCategory,
        content: newContent.trim(),
      }),
    });
    if (res.ok) {
      const { feedback: entry } = await res.json();
      setFeedback(prev => [entry, ...prev]);
      setNewContent("");
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/teacher/feedback?id=${id}`, { method: "DELETE" });
    setFeedback(prev => prev.filter(f => f.id !== id));
    setDeleting(null);
  }

  return (
    <div className="space-y-5">
      {/* Class selector */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Class</p>
        {classes.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">No classes assigned. Ask admin to set up your timetable.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                  selectedClass === cls
                    ? "bg-[#0f1f6b] dark:bg-blue-600 text-white border-transparent"
                    : "bg-white dark:bg-[#1a2035] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Student list */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Students
            </p>
            {loadingStudents ? (
              <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-8 flex justify-center">
                <div className="w-5 h-5 border-2 border-[#0f1f6b] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">No students in this class.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                {students.map(student => {
                  const count = feedbackFor(student.id).length;
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(isSelected ? null : student)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-0 border-slate-50 dark:border-white/5 ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                          {initials(student.name)}
                        </span>
                      </div>
                      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {student.name}
                      </span>
                      {count > 0 && (
                        <span className="text-[11px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full shrink-0">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Feedback panel */}
          <div className="lg:col-span-2">
            {!selectedStudent ? (
              <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-12 flex flex-col items-center justify-center text-center min-h-[220px]">
                <svg className="w-10 h-10 text-slate-200 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Select a student to view and add feedback
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Student header */}
                <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {initials(selectedStudent.name)}
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800 dark:text-white">{selectedStudent.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{selectedClass}</p>
                  </div>
                </div>

                {/* Add feedback form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    New Feedback
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setNewCategory(cat.key)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          newCategory === cat.key
                            ? CAT_COLORS[cat.color]
                            : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="Write your feedback here…"
                    rows={3}
                    className="w-full text-sm text-slate-700 dark:text-white bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !newContent.trim()}
                      className="px-5 py-2 bg-[#0f1f6b] hover:bg-[#1a30a0] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      {submitting ? "Saving…" : "Add Feedback"}
                    </button>
                  </div>
                </form>

                {/* Existing feedback */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
                    Previous Feedback
                    {feedbackFor(selectedStudent.id).length > 0 && (
                      <span className="ml-2 text-[11px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                        {feedbackFor(selectedStudent.id).length}
                      </span>
                    )}
                  </p>
                  {feedbackFor(selectedStudent.id).length === 0 ? (
                    <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center">
                      <p className="text-sm text-slate-400 dark:text-slate-500">No feedback yet for this student.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {feedbackFor(selectedStudent.id).map(entry => (
                        <div key={entry.id} className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${catColor(entry.category)}`}>
                                {catLabel(entry.category)}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {fmtDate(entry.created_at)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={deleting === entry.id}
                              className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 disabled:opacity-50 transition-colors p-1 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {entry.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
