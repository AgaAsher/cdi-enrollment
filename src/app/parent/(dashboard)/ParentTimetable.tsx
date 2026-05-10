"use client";

import { useState } from "react";

type SlotCell = { subject: string; teacher: string; room: string; isFixed: boolean };
type TimetableRow = { time: string; duration: string; color: string; cells: SlotCell[][] };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const CELL_COLORS: Record<string, string> = {
  blue:   "bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-200 border-blue-100 dark:border-blue-500/20",
  indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 border-indigo-100 dark:border-indigo-500/20",
  amber:  "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-100 dark:border-amber-500/20",
  green:  "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-100 dark:border-emerald-500/20",
  purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-800 dark:text-purple-200 border-purple-100 dark:border-purple-500/20",
  orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-800 dark:text-orange-200 border-orange-100 dark:border-orange-500/20",
  pink:   "bg-pink-50 dark:bg-pink-500/10 text-pink-800 dark:text-pink-200 border-pink-100 dark:border-pink-500/20",
  violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-800 dark:text-violet-200 border-violet-100 dark:border-violet-500/20",
  slate:  "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10",
};

export default function ParentTimetable({
  gradeLabel,
  rows,
}: {
  gradeLabel: string;
  rows: TimetableRow[] | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (rows === null) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
        No timetable published yet.
      </p>
    );
  }

  const lessonRows = rows.filter(row =>
    row.cells.some(dayCells => dayCells.some(c => c.subject))
  );

  if (lessonRows.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
        No lessons scheduled for {gradeLabel} yet.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
      >
        {expanded ? "Hide Timetable ▲" : "View Timetable ▼"}
      </button>

      {expanded && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100 dark:border-white/8">
          <table className="w-full text-xs min-w-[380px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/4 border-b border-slate-100 dark:border-white/8">
                <th className="text-left px-3 py-2 text-slate-400 dark:text-slate-500 font-semibold w-14">
                  Time
                </th>
                {DAYS.map(d => (
                  <th key={d} className="px-1 py-2 text-center text-slate-400 dark:text-slate-500 font-semibold">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lessonRows.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                  <td className="px-3 py-1.5 align-top">
                    <p className="font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.time}</p>
                    {row.duration && (
                      <p className="text-[10px] text-slate-400">{row.duration}</p>
                    )}
                  </td>
                  {[0, 1, 2, 3, 4].map(d => {
                    const dayCells = row.cells[d] ?? [];
                    const cell = dayCells.find(c => c.subject) ?? null;
                    const colors = CELL_COLORS[row.color] ?? CELL_COLORS.slate;
                    return (
                      <td key={d} className="px-0.5 py-1 align-top">
                        {cell ? (
                          <div className={`rounded-lg px-1.5 py-1 border text-center ${colors}`}>
                            <p className="font-semibold text-[11px] leading-tight">{cell.subject}</p>
                            {cell.teacher && (
                              <p className="text-[10px] opacity-70 mt-0.5 truncate">{cell.teacher}</p>
                            )}
                            {cell.room && (
                              <p className="text-[10px] opacity-60">{cell.room}</p>
                            )}
                          </div>
                        ) : (
                          <div className="min-h-[32px] flex items-center justify-center text-slate-200 dark:text-slate-700 text-xs">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
