"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Enrollment } from "@/lib/types";

const GRADES = [
  { key: "Toddler (18–30 months)",   label: "Toddler",   color: "blue"    },
  { key: "Nursery (30–42 months)",   label: "Nursery",   color: "violet"  },
  { key: "Reception (42–54 months)", label: "Reception", color: "emerald" },
  { key: "Pre-KG (54–72 months)",    label: "Pre-KG",    color: "amber"   },
];

const GRADE_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
  blue:    { ring: "ring-blue-200 dark:ring-blue-500/30",     bg: "bg-blue-50 dark:bg-blue-500/10",     text: "text-blue-700 dark:text-blue-300"    },
  violet:  { ring: "ring-violet-200 dark:ring-violet-500/30", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-300" },
  emerald: { ring: "ring-emerald-200 dark:ring-emerald-500/30",bg:"bg-emerald-50 dark:bg-emerald-500/10",text:"text-emerald-700 dark:text-emerald-300"},
  amber:   { ring: "ring-amber-200 dark:ring-amber-500/30",   bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-700 dark:text-amber-300"   },
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

type GradePanel = { key: string; label: string; color: string } | null;

function ClassPanel({
  grade,
  students,
  onClose,
  onOpenStudent,
}: {
  grade: NonNullable<GradePanel>;
  students: Enrollment[];
  onClose: () => void;
  onOpenStudent: (id: string) => void;
}) {
  const c = GRADE_COLORS[grade.color];
  const [clickMap, setClickMap] = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  function handleStudentClick(id: string) {
    if (clickMap[id]) {
      clearTimeout(clickMap[id]);
      setClickMap(prev => { const n = { ...prev }; delete n[id]; return n; });
      onOpenStudent(id);
    } else {
      const t = setTimeout(() => {
        setClickMap(prev => { const n = { ...prev }; delete n[id]; return n; });
      }, 300);
      setClickMap(prev => ({ ...prev, [id]: t }));
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-white dark:bg-[#141c2e] border-l border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between`}>
          <div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text} mb-1`}>
              {grade.label}
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {students.length} student{students.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {students.length === 0 ? (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-12">No students in this class yet.</p>
          ) : (
            students.map((s) => {
              const initials =
                (s.child_first_name?.[0] ?? "").toUpperCase() +
                (s.child_last_name?.[0] ?? "").toUpperCase();
              return (
                <div
                  key={s.id}
                  onClick={() => handleStudentClick(s.id)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/15 transition-all select-none"
                  title="Double-click to open profile"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${c.bg}`}>
                    <span className={`text-sm font-bold ${c.text}`}>{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                      {s.child_first_name} {s.child_last_name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {s.child_date_of_birth} · {s.child_nationality}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 dark:border-white/10">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">Double-click a student to open their profile</p>
        </div>
      </div>
    </>
  );
}

export default function StudentsSchoolView({ enrollments }: { enrollments: Enrollment[] }) {
  const router = useRouter();
  const accepted = enrollments.filter((e) => e.status === "accepted");
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradePanel>(null);
  const [clickMap, setClickMap] = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetch("/api/admin/feedback")
      .then(r => r.json())
      .then(d => setFeedback(d.feedback ?? []));
  }, []);

  const feedbackFor = (id: string) => feedback.filter(f => f.enrollment_id === id);

  function handleDeleteFeedback(id: string) {
    setFeedback(prev => prev.filter(f => f.id !== id));
  }

  function handleGradeCardClick(grade: { key: string; label: string; color: string }) {
    if (clickMap[grade.key]) {
      clearTimeout(clickMap[grade.key]);
      setClickMap(prev => { const n = { ...prev }; delete n[grade.key]; return n; });
      setSelectedGrade(grade);
    } else {
      const t = setTimeout(() => {
        setClickMap(prev => { const n = { ...prev }; delete n[grade.key]; return n; });
      }, 300);
      setClickMap(prev => ({ ...prev, [grade.key]: t }));
    }
  }

  const countsByGrade = GRADES.map(({ key, label, color }) => ({
    key,
    label,
    color,
    count: accepted.filter((e) => e.applying_for_grade === key).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Students</h1>

      {/* Stats bar — double-click to open class panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {countsByGrade.map(({ key, label, color, count }) => {
          const c = GRADE_COLORS[color];
          return (
            <div
              key={key}
              onClick={() => handleGradeCardClick({ key, label, color })}
              className={`glass-card p-4 ring-1 ${c.ring} flex flex-col items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform select-none`}
              title="Double-click to view class"
            >
              <span className={`text-2xl font-bold ${c.text}`}>{count}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Class panel */}
      {selectedGrade && (
        <ClassPanel
          grade={selectedGrade}
          students={accepted.filter(s => s.applying_for_grade === selectedGrade.key)}
          onClose={() => setSelectedGrade(null)}
          onOpenStudent={(id) => { setSelectedGrade(null); router.push(`/admin/${id}`); }}
        />
      )}

      {/* Total */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-white">{accepted.length}</span> accepted student{accepted.length !== 1 ? "s" : ""} total
      </p>

      {/* Student cards */}
      {accepted.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">No accepted students yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accepted.map((s) => {
            const c = gradeColorFor(s.applying_for_grade);
            const initials =
              (s.child_first_name?.[0] ?? "").toUpperCase() +
              (s.child_last_name?.[0] ?? "").toUpperCase();
            const fb = feedbackFor(s.id);
            const isExpanded = expandedId === s.id;
            return (
              <div key={s.id} className="glass-card p-5 flex flex-col gap-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {s.child_first_name} {s.child_last_name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
                      {gradeLabel(s.applying_for_grade)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{s.child_date_of_birth}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8L3 21" />
                    </svg>
                    <span>{s.child_nationality}</span>
                  </div>
                  {s.languages_spoken && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="truncate">{s.languages_spoken}</span>
                    </div>
                  )}
                </div>

                {/* Parent info */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/8">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Parent</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{s.parent1_full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.parent1_phone}</p>
                </div>

                {/* Feedback toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/8 text-left w-full group"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    Teacher Feedback
                    {fb.length > 0 && (
                      <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                        {fb.length}
                      </span>
                    )}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
      )}
    </div>
  );
}
