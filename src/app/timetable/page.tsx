import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const BG: Record<string, string> = {
  blue:   "bg-blue-100 dark:bg-blue-500/15",   indigo: "bg-indigo-100 dark:bg-indigo-500/15",
  amber:  "bg-amber-100 dark:bg-amber-500/15",  green:  "bg-emerald-100 dark:bg-emerald-500/15",
  purple: "bg-purple-100 dark:bg-purple-500/15", orange: "bg-orange-100 dark:bg-orange-500/15",
  pink:   "bg-pink-100 dark:bg-pink-500/15",   violet: "bg-violet-100 dark:bg-violet-500/15",
  slate:  "bg-slate-100 dark:bg-white/5",
};
const TX: Record<string, string> = {
  blue:   "text-blue-800 dark:text-blue-300",   indigo: "text-indigo-800 dark:text-indigo-300",
  amber:  "text-amber-800 dark:text-amber-300",  green:  "text-emerald-800 dark:text-emerald-300",
  purple: "text-purple-800 dark:text-purple-300", orange: "text-orange-800 dark:text-orange-300",
  pink:   "text-pink-800 dark:text-pink-300",   violet: "text-violet-800 dark:text-violet-300",
  slate:  "text-slate-500 dark:text-slate-300",
};

type SlotCell = { subject: string; teacher: string; room: string; group: string; groupLabel: string; isFixed: boolean };
type GRow     = { time: string; duration: string; color: string; cells: SlotCell[][] };
type ClassOut = { label: string; rows: GRow[] };
type TimetableData = Record<string, ClassOut>;

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; teacher?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("published_timetables")
    .select("timetable_data, academic_year, published_at")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-700 dark:text-white mb-2">No Timetable Published</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">The school has not published a timetable yet. Please check back later.</p>
        </div>
      </div>
    );
  }

  const timetable = data.timetable_data as TimetableData;
  const allKeys = Object.keys(timetable);
  const teacherMode = !!params.teacher;
  const activeKey = params.class ?? allKeys[0] ?? "";

  // Build teacher view: collect all rows where teacher appears
  const teacherName = params.teacher ?? "";
  const teacherRows: Array<{ classLabel: string; row: GRow; dayIndex: number; cell: SlotCell }> = [];

  if (teacherMode && teacherName) {
    for (const [, cls] of Object.entries(timetable)) {
      for (const row of cls.rows) {
        for (let d = 0; d < 5; d++) {
          for (const cell of row.cells[d] ?? []) {
            if (!cell.isFixed && cell.teacher === teacherName) {
              teacherRows.push({ classLabel: cls.label, row, dayIndex: d, cell });
            }
          }
        }
      }
    }
  }

  const publishedDate = new Date(data.published_at).toLocaleDateString("en", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a2035] border-b border-slate-200 dark:border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0f1f6b] rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f1f6b] dark:text-white leading-none">CDA International School</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{data.academic_year} · Published {publishedDate}</p>
            </div>
          </div>

          {/* Nav: class links */}
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {allKeys.map(key => (
              <Link
                key={key}
                href={`/timetable?class=${key}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  !teacherMode && activeKey === key
                    ? "bg-[#0f1f6b] dark:bg-blue-600 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0f1f6b] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                {timetable[key].label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Teacher view */}
        {teacherMode && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
                <span className="text-xs font-bold text-white">
                  {teacherName.split(" ").filter((_, i) => i > 0).map(w => w[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">{teacherName}</h1>
                <p className="text-sm text-slate-400 dark:text-slate-500">Personal teaching schedule</p>
              </div>
            </div>

            {teacherRows.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-10 text-center">
                <p className="text-slate-400 dark:text-slate-500 text-sm">No lessons found for this teacher in the current timetable.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                      <th className="text-left px-4 py-3 text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide w-24">Time</th>
                      <th className="text-left px-4 py-3 text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide">Day</th>
                      <th className="text-left px-4 py-3 text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide">Subject</th>
                      <th className="text-left px-4 py-3 text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide">Class</th>
                      <th className="text-left px-4 py-3 text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide">Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherRows
                      .sort((a, b) => {
                        const toMin = (t: string) => { const [h, m = 0] = t.split(":").map(Number); return h * 60 + m; };
                        return a.dayIndex - b.dayIndex || toMin(a.row.time) - toMin(b.row.time);
                      })
                      .map(({ classLabel, row, dayIndex, cell }, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{row.time}</span>
                            {row.duration && <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">{row.duration}</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-medium">{DAYS[dayIndex]}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${BG[row.color]} ${TX[row.color]}`}>
                              {cell.subject}
                              {cell.groupLabel && <span className="ml-1 opacity-60">({cell.groupLabel})</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{classLabel}</td>
                          <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">{cell.room || "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Class view */}
        {!teacherMode && timetable[activeKey] && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">
                {timetable[activeKey].label} — Weekly Timetable
              </h1>
              <span className="text-xs text-slate-400 dark:text-slate-400 bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-full font-medium">
                Mon – Fri · 08:00 – 15:30
              </span>
            </div>

            <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                    <th className="text-left px-4 py-3 text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide w-24">Time</th>
                    {DAYS.map(d => (
                      <th key={d} className="px-3 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide text-center">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetable[activeKey].rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-slate-100 dark:border-white/5 last:border-0">
                      <td className="px-4 py-2 align-middle">
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{row.time}</p>
                        {row.duration && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{row.duration}</p>}
                      </td>
                      {row.cells.map((cellArr, di) => {
                        const isSplit = cellArr.length > 1;
                        return (
                          <td key={di} className="px-1.5 py-1.5">
                            {isSplit ? (
                              <div className="flex flex-col gap-0.5">
                                {cellArr.map((cell, gi) => (
                                  <div key={gi} className={`rounded-xl px-2 py-1.5 text-center flex flex-col items-center justify-center gap-0.5 ${BG[row.color]} ${TX[row.color]}`}>
                                    {cell.groupLabel && (
                                      <span className="text-[9px] font-bold opacity-60 uppercase tracking-wide leading-none">{cell.groupLabel}</span>
                                    )}
                                    <span className="font-semibold text-xs leading-tight">{cell.subject || "—"}</span>
                                    {!cell.isFixed && cell.teacher && (
                                      <span className="text-[10px] opacity-70 leading-tight">{cell.teacher.split(" ").slice(-1)[0]}</span>
                                    )}
                                    {!cell.isFixed && cell.room && (
                                      <span className="text-[10px] opacity-55 leading-tight">{cell.room}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`rounded-xl px-2 py-2 text-center min-h-[52px] flex flex-col items-center justify-center gap-0.5 ${BG[row.color]} ${TX[row.color]}`}>
                                <span className="font-semibold text-xs leading-tight">{cellArr[0]?.subject || "—"}</span>
                                {!cellArr[0]?.isFixed && cellArr[0]?.teacher && (
                                  <span className="text-[10px] opacity-70 leading-tight mt-0.5">
                                    {cellArr[0].teacher.split(" ").slice(-1)[0]}
                                  </span>
                                )}
                                {!cellArr[0]?.isFixed && cellArr[0]?.room && (
                                  <span className="text-[10px] opacity-55 leading-tight">{cellArr[0].room}</span>
                                )}
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

            <p className="text-xs text-slate-300 dark:text-slate-600 text-center mt-4">
              CDA International School of Laos · {data.academic_year}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
