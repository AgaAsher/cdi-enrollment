"use client";

import { useState } from "react";

const MEALS = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack"];
const DAYS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const MEAL_CFG: Record<string, { dot: string; badge: string }> = {
  "Breakfast":       { dot: "bg-amber-400",   badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"     },
  "Morning Snack":   { dot: "bg-emerald-400", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  "Lunch":           { dot: "bg-blue-400",    badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"         },
  "Afternoon Snack": { dot: "bg-violet-400",  badge: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"  },
};

type MenuData = Record<string, Record<string, string>>;

export default function ParentWeeklyMenu({
  menuData,
  todayDayName,
}: {
  menuData: MenuData | null;
  todayDayName: string | null;
}) {
  const [weekOpen, setWeekOpen] = useState(false);

  const todayMeals: Record<string, string> =
    todayDayName && menuData ? (menuData[todayDayName] ?? {}) : {};
  const hasToday   = MEALS.some(m => todayMeals[m]);
  const hasAnyMenu = !!menuData && DAYS.some(d => MEALS.some(m => menuData[d]?.[m]));

  return (
    <div className="space-y-3">
      {/* Today's meals card */}
      <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/8">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm font-bold text-slate-800 dark:text-white">Today&apos;s Menu</p>
            {todayDayName && (
              <span className="text-xs text-slate-400 dark:text-slate-500">— {todayDayName}</span>
            )}
          </div>
          {hasAnyMenu && (
            <button
              onClick={() => setWeekOpen(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Full week
              <svg
                className={`w-3.5 h-3.5 transition-transform ${weekOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Today body */}
        {!todayDayName ? (
          <p className="px-5 py-4 text-xs text-slate-400 dark:text-slate-500 italic">No menu today — it&apos;s the weekend.</p>
        ) : !hasToday ? (
          <p className="px-5 py-4 text-xs text-slate-400 dark:text-slate-500 italic">No menu available for today.</p>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            {MEALS.map(meal => {
              const val = todayMeals[meal] ?? "";
              if (!val) return null;
              const cfg = MEAL_CFG[meal];
              return (
                <div key={meal} className="flex items-start gap-3 px-5 py-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0 flex-1">
                    <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full mb-1 ${cfg.badge}`}>
                      {meal}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{val}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full week grid */}
      {weekOpen && hasAnyMenu && menuData && (
        <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/8">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide w-28">
                    Meal
                  </th>
                  {DAYS.map((day, i) => (
                    <th
                      key={day}
                      className={`px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide ${
                        day === todayDayName
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {DAY_SHORT[i]}
                      {day === todayDayName && (
                        <span className="ml-1 w-1 h-1 rounded-full bg-blue-500 inline-block align-middle" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEALS.map(meal => {
                  const cfg = MEAL_CFG[meal];
                  return (
                    <tr key={meal} className="border-b border-slate-50 dark:border-white/4 last:border-0">
                      <td className="px-4 py-2.5 align-top whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          {meal}
                        </span>
                      </td>
                      {DAYS.map(day => {
                        const val = menuData[day]?.[meal] ?? "";
                        return (
                          <td
                            key={day}
                            className={`px-2 py-2.5 align-top leading-snug ${
                              val ? "text-slate-700 dark:text-slate-300" : "text-slate-300 dark:text-slate-600"
                            } ${day === todayDayName ? "bg-blue-50/40 dark:bg-blue-500/5" : ""}`}
                          >
                            {val || "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
