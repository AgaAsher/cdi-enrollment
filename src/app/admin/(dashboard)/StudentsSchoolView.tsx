"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Enrollment } from "@/lib/types";

const GRADES = [
  { key: "Toddler (18–30 months)",   label: "Toddler",   color: "blue"    },
  { key: "Nursery (30–42 months)",   label: "Nursery",   color: "violet"  },
  { key: "Reception (42–54 months)", label: "Reception", color: "emerald" },
  { key: "Pre-KG (54–72 months)",    label: "Pre-KG",    color: "amber"   },
];

const GRADE_COLORS: Record<string, { ring: string; bg: string; text: string; ringActive: string }> = {
  blue:    { ring: "ring-blue-200 dark:ring-blue-500/30",     bg: "bg-blue-50 dark:bg-blue-500/10",     text: "text-blue-700 dark:text-blue-300",    ringActive: "ring-blue-400 dark:ring-blue-400"    },
  violet:  { ring: "ring-violet-200 dark:ring-violet-500/30", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-300", ringActive: "ring-violet-400 dark:ring-violet-400" },
  emerald: { ring: "ring-emerald-200 dark:ring-emerald-500/30",bg:"bg-emerald-50 dark:bg-emerald-500/10",text:"text-emerald-700 dark:text-emerald-300",ringActive: "ring-emerald-400 dark:ring-emerald-400"},
  amber:   { ring: "ring-amber-200 dark:ring-amber-500/30",   bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-700 dark:text-amber-300",   ringActive: "ring-amber-400 dark:ring-amber-400"   },
};

const FEEDBACK_COLORS: Record<string, string> = {
  academic: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  behavior: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  social:   "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  health:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  general:  "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-400",
};
const FEEDBACK_LABELS: Record<string, string> = {
  academic: "Academic", behavior: "Behavior", social: "Social", health: "Health", general: "General",
};

type FeedbackEntry = {
  id: string;
  enrollment_id: string;
  teacher_name: string;
  class_label: string;
  category: string;
  content: string;
  created_at: string;
};

function gradeColorFor(gradeKey: string) {
  const grade = GRADES.find((g) => g.key === gradeKey);
  return grade ? GRADE_COLORS[grade.color] : GRADE_COLORS.blue;
}

function gradeLabel(gradeKey: string) {
  return GRADES.find((g) => g.key === gradeKey)?.label ?? gradeKey;
}

function StudentFeedbackPanel({ student, feedback, onDelete }: {
  student: Enrollment;
  feedback: FeedbackEntry[];
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
    onDelete(id);
    setDeleting(null);
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/8">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">
        Teacher Feedback
        {feedback.length > 0 && (
          <span className="ml-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
            {feedback.length}
          </span>
        )}
      </p>
      {feedback.length === 0 ? (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No feedback yet.</p>
      ) : (
        <div className="space-y-2">
          {feedback.map(entry => (
            <div key={entry.id} className="bg-slate-50 dark:bg-white/4 rounded-xl p-3 relative group">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${FEEDBACK_COLORS[entry.category] ?? FEEDBACK_COLORS.general}`}>
                  {FEEDBACK_LABELS[entry.category] ?? entry.category}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-1 truncate">
                  {entry.teacher_name} · {new Date(entry.created_at).toLocaleDateString("en", { day: "numeric", month: "short" })}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-600 hover:text-red-400 disabled:opacity-50 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentsSchoolView({ enrollments }: { enrollments: Enrollment[] }) {
  const router = useRouter();
  const accepted = enrollments.filter((e) => e.status === "accepted");
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedGradeKey, setSelectedGradeKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/feedback")
      .then(r => r.json())
      .then(d => setFeedback(d.feedback ?? []));
  }, []);

  const feedbackFor = (id: string) => feedback.filter(f => f.enrollment_id === id);

  function handleDeleteFeedback(id: string) {
    setFeedback(prev => prev.filter(f => f.id !== id));
  }

  const countsByGrade = GRADES.map(({ key, label, color }) => ({
    key, label, color,
    count: accepted.filter((e) => e.applying_for_grade === key).length,
  }));

  const selectedGrade = GRADES.find(g => g.key === selectedGradeKey) ?? null;
  const visibleStudents = selectedGradeKey
    ? accepted.filter(s => s.applying_for_grade === selectedGradeKey)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Students</h1>
        <Link
          href="/admin/add-student"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </Link>
      </div>

      {/* Grade cards — double-click to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {countsByGrade.map(({ key, label, color, count }) => {
          const c = GRADE_COLORS[color];
          const isSelected = selectedGradeKey === key;
          return (
            <div
              key={key}
              onDoubleClick={() => setSelectedGradeKey(isSelected ? null : key)}
              className={`glass-card p-4 flex flex-col items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all select-none ring-1 ${
                isSelected ? `${c.ringActive} ring-2 scale-[1.02]` : c.ring
              }`}
              title="Double-click to view class"
            >
              <span className={`text-2xl font-bold ${c.text}`}>{count}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Class header + clear */}
      {selectedGrade && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-white">{visibleStudents.length}</span>{" "}
            student{visibleStudents.length !== 1 ? "s" : ""} in{" "}
            <span className={`font-semibold ${GRADE_COLORS[selectedGrade.color].text}`}>{selectedGrade.label}</span>
          </p>
          <button
            onClick={() => setSelectedGradeKey(null)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            Clear
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Student cards — only shown when a class is selected */}
      {selectedGradeKey && (
        visibleStudents.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">No students in this class yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {visibleStudents.map((s) => {
              const c = gradeColorFor(s.applying_for_grade);
              const initials =
                (s.child_first_name?.[0] ?? "").toUpperCase() +
                (s.child_last_name?.[0] ?? "").toUpperCase();
              const fb = feedbackFor(s.id);
              const isExpanded = expandedId === s.id;
              return (
                <div key={s.id} className="glass-card p-3 flex flex-col gap-2">
                  {/* Avatar + name — double-click to open profile */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold text-slate-800 dark:text-white truncate cursor-pointer select-none"
                        onDoubleClick={() => router.push(`/admin/${s.id}`)}
                        title="Double-click to open profile"
                      >
                        {s.child_first_name} {s.child_last_name}
                      </p>
                      <span className={`inline-flex items-center px-1.5 py-px rounded-full text-[9px] font-bold ${c.bg} ${c.text}`}>
                        {gradeLabel(s.applying_for_grade)}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{s.child_date_of_birth}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8L3 21" />
                      </svg>
                      <span className="truncate">{s.child_nationality}</span>
                    </div>
                  </div>

                  {/* Parent info */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/8">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">Parent</p>
                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{s.parent1_full_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.parent1_phone}</p>
                  </div>

                  {/* Authorized pickup persons */}
                  {s.pickup_persons?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-white/8">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
                        Authorized Pickup
                      </p>
                      <div className="space-y-1.5">
                        {s.pickup_persons.map((p, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{p.relationship} · {p.phone}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-white/8 text-left w-full group"
                  >
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                      Teacher Feedback
                      {fb.length > 0 && (
                        <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                          {fb.length}
                        </span>
                      )}
                    </span>
                    <svg
                      className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <StudentFeedbackPanel
                      student={s}
                      feedback={fb}
                      onDelete={handleDeleteFeedback}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
