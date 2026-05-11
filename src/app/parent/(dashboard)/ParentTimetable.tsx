"use client";

import { useState, useEffect } from "react";

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

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function parseDurationMinutes(duration: string): number {
  if (!duration) return 60;
  const hrMatch = duration.match(/(\d+(?:\.\d+)?)\s*hr/);
  const minMatch = duration.match(/(\d+)\s*min/);
  let total = 0;
  if (hrMatch) total += parseFloat(hrMatch[1]) * 60;
  if (minMatch) total += parseInt(minMatch[1]);
  return total || 60;
}

function useNowMinutes() {
  const getNow = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  };
  const [now, setNow] = useState(getNow);
  useEffect(() => {
    const id = setInterval(() => setNow(getNow()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function ParentTimetable({
  gradeLabel,
  rows,
}: {
  gradeLabel: string;
  rows: TimetableRow[] | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const nowMinutes = useNowMinutes();

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

  // Find the active row index
  const activeRowIdx = lessonRows.findIndex((row) => {
    const start = parseMinutes(row.time);
    const end = start + parseDurationMinutes(row.duration);
    return nowMinutes >= start && nowMinutes < end;
  });

  return (
    <div>
      {/* Section header / toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between group"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          Timetable
        </span>
        <div className="flex items-center gap-2">
          {/* Live clock */}
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
            {formatTime(nowMinutes)}
          </span>
          {activeRowIdx >= 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Now
            </span>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all ${expanded ? "" : "rotate-180"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
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
              {lessonRows.map((row, ri) => {
                const isActive = ri === activeRowIdx;
                return (
                  <tr
                    key={ri}
                    className={`border-b border-slate-50 dark:border-white/5 last:border-0 transition-colors ${
                      isActive ? "bg-emerald-50/60 dark:bg-emerald-500/8" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 align-top">
                      <div className="flex items-center gap-1">
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        )}
                        <p className={`font-bold whitespace-nowrap ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`}>
                          {row.time}
                        </p>
                      </div>
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
                            <div className={`rounded-lg px-1.5 py-1 border text-center ${colors} ${isActive ? "ring-1 ring-emerald-400/40 dark:ring-emerald-500/30" : ""}`}>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
