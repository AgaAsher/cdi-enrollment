"use client";

import { useState } from "react";

const MEALS = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack"];
const DAYS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const MEAL_CFG: Record<string, { dot: string; badge: string }> = {
  "Breakfast":       { dot: "bg-amber-400",   badge: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"        },
  "Morning Snack":   { dot: "bg-emerald-400", badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  "Lunch":           { dot: "bg-blue-400",    badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"            },
  "Afternoon Snack": { dot: "bg-violet-400",  badge: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"    },
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
    <>
      {/* Today label */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {todayDayName ? `Today — ${todayDayName}` : "Today"}
        </p>
      </div>

      {/* Today meals */}
      {!todayDayName ? (
        <p className="px-5 pb-4 text-sm text-slate-400 dark:text-slate-500 italic">No menu today — it&apos;s the weekend.</p>
      ) : !hasToday ? (
        <p className="px-5 pb-4 text-sm text-slate-400 dark:text-slate-500 italic">No menu available for today.</p>
      ) : (
        <div className="px-5 pb-3 space-y-2.5">
          {MEALS.map(meal => {
            const val = todayMeals[meal] ?? "";
            if (!val) return null;
            const cfg = MEAL_CFG[meal];
            return (
              <div key={meal} className="flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                <div className="min-w-0 flex-1">
                  <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full mb-0.5 ${cfg.badge}`}>
                    {meal}
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{val}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full week toggle */}
      {hasAnyMenu && menuData && (
        <>
          <button
            onClick={() => setWeekOpen(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 px-5 py-3 border-t border-slate-100 dark:border-white/8 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            {weekOpen ? "Hide full week" : "View full week"}
            <svg
              className={`w-3.5 h-3.5 transition-transform ${weekOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {weekOpen && (
            <div className="border-t border-slate-100 dark:border-white/8 overflow-x-auto">
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
          )}
        </>
      )}
    </>
  );
}
