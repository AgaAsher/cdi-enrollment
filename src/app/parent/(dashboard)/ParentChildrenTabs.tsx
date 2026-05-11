"use client";

import React from "react";
import { Enrollment } from "@/lib/types";
import ParentTimetable from "./ParentTimetable";
import { useParentLang } from "@/components/ParentLangProvider";

type FeedbackEntry = {
  id: string;
  enrollment_id: string;
  teacher_name: string;
  class_label: string;
  category: string;
  content: string;
  created_at: string;
};

type TimetableRow = { time: string; duration: string; color: string; cells: { subject: string; teacher: string; room: string; isFixed: boolean }[][] };
type ClassOut = { label: string; rows: TimetableRow[] };
type TimetableData = Record<string, ClassOut>;

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

function gradeShort(gradeKey: string): string {
  if (gradeKey.startsWith("Toddler"))   return "Toddler";
  if (gradeKey.startsWith("Nursery"))   return "Nursery";
  if (gradeKey.startsWith("Reception")) return "Reception";
  if (gradeKey.startsWith("Pre-KG"))    return "Pre-KG";
  return gradeKey;
}

function findClassRows(data: TimetableData, gradeKey: string): TimetableRow[] | null {
  const short = gradeShort(gradeKey);
  const byLabel = Object.values(data).find(c => c.label.toLowerCase() === short.toLowerCase());
  if (byLabel) return byLabel.rows;
  const byKey = Object.entries(data).find(([k]) => k.toLowerCase() === short.toLowerCase());
  if (byKey) return byKey[1].rows;
  return null;
}

export default function ParentChildrenTabs({
  children,
  attendanceSummaries,
  allFeedback,
  timetableData,
  activeIdx,
  setActiveIdx,
}: {
  children: Enrollment[];
  attendanceSummaries: { present: number; absent: number }[];
  allFeedback: FeedbackEntry[];
  timetableData: TimetableData | null;
  activeIdx: number;
  setActiveIdx: (i: number) => void;
}) {
  const { t } = useParentLang();

  if (children.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm">No enrolled children found.</p>
      </div>
    );
  }

  const child = children[activeIdx];
  const att   = attendanceSummaries[activeIdx];
  const grade = gradeShort(child.applying_for_grade);
  const initials =
    (child.child_first_name?.[0] ?? "").toUpperCase() +
    (child.child_last_name?.[0] ?? "").toUpperCase();
  const childFeedback = allFeedback.filter(f => f.enrollment_id === child.id).slice(0, 5);

  return (
    <div>
      {/* Child switcher tabs — only when multiple children */}
      {children.length > 1 && (
        <div className="flex border-b border-slate-100 dark:border-white/8 overflow-x-auto bg-slate-50 dark:bg-white/3">
          {children.map((c, i) => {
            const ini =
              (c.child_first_name?.[0] ?? "").toUpperCase() +
              (c.child_last_name?.[0] ?? "").toUpperCase();
            const isActive = i === activeIdx;
            return (
              <button
                key={c.id}
                onClick={() => setActiveIdx(i)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-transparent"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                }`}
              >
                <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                }`}>
                  {ini}
                </span>
                {c.child_first_name}
              </button>
            );
          })}
        </div>
      )}

      {/* Child content */}
      <div className="p-6">

        {/* Child header */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-white/8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1a3fa8 0%, #0f1f6b 100%)" }}>
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              {child.child_first_name} {child.child_last_name}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300">
                {grade}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{child.academic_year}</span>
              <span className="text-slate-300 dark:text-white/15">·</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{att.present}</span>
                {t.present}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{att.absent}</span>
                {t.absent}
              </span>
            </div>
          </div>
        </div>

        {/* Teacher feedback */}
        {childFeedback.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">
              {t.teacherFeedback}
            </p>
            <div className="space-y-2.5">
              {childFeedback.map(entry => (
                <div key={entry.id}
                  className="rounded-xl p-4 bg-slate-50 dark:bg-white/4 border border-slate-100 dark:border-white/6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${FEEDBACK_COLORS[entry.category] ?? FEEDBACK_COLORS.general}`}>
                      {FEEDBACK_LABELS[entry.category] ?? entry.category}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {entry.teacher_name} · {new Date(entry.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{entry.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timetable */}
        <ParentTimetable
          gradeLabel={gradeShort(child.applying_for_grade)}
          rows={timetableData ? (findClassRows(timetableData, child.applying_for_grade) ?? []) : null}
        />
      </div>
    </div>
  );
}
