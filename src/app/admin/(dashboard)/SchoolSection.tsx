import { Enrollment } from "@/lib/types";
import AttendanceView from "./AttendanceView";
import TimetableEditor from "./TimetableEditor";
import TeachersSection from "./TeachersSection";

const GRADES = [
  { key: "Toddler (18–30 months)",   label: "Toddler",   age: "18–30 months", color: "blue"    },
  { key: "Nursery (30–42 months)",   label: "Nursery",   age: "30–42 months", color: "violet"  },
  { key: "Reception (42–54 months)", label: "Reception", age: "42–54 months", color: "emerald" },
  { key: "Pre-KG (54–72 months)",    label: "Pre-KG",    age: "54–72 months", color: "amber"   },
];
const CLASS_LIMIT = 15;

const GRADE_COLORS: Record<string, { ring: string; bg: string; text: string; bar: string }> = {
  blue:    { ring: "ring-blue-200 dark:ring-blue-500/30",    bg: "bg-blue-50 dark:bg-blue-500/10",    text: "text-blue-700 dark:text-blue-300",    bar: "bg-blue-500"   },
  violet:  { ring: "ring-violet-200 dark:ring-violet-500/30",bg: "bg-violet-50 dark:bg-violet-500/10",text: "text-violet-700 dark:text-violet-300",bar: "bg-violet-500" },
  emerald: { ring: "ring-emerald-200 dark:ring-emerald-500/30",bg:"bg-emerald-50 dark:bg-emerald-500/10",text:"text-emerald-700 dark:text-emerald-300",bar:"bg-emerald-500"},
  amber:   { ring: "ring-amber-200 dark:ring-amber-500/30",  bg: "bg-amber-50 dark:bg-amber-500/10",  text: "text-amber-700 dark:text-amber-300",  bar: "bg-amber-400"  },
};


const SCHOOL_EVENTS = [
  { date: "2026-05-15", title: "Parent–Teacher Meeting",   type: "Meeting",  color: "blue"   },
  { date: "2026-05-20", title: "Sports Day",               type: "Activity", color: "green"  },
  { date: "2026-06-01", title: "Children's Day Parade",    type: "Festival", color: "pink"   },
  { date: "2026-06-10", title: "Art Exhibition",           type: "Showcase", color: "violet" },
  { date: "2026-06-20", title: "End-of-Year Ceremony",     type: "Ceremony", color: "amber"  },
];
const EVENT_COLORS: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  green:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  pink:   "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  amber:  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

const NOTICES = [
  { date: "2026-05-06", title: "School Uniform Reminder",         category: "Admin",  color: "slate", body: "Please ensure all students wear full uniform every Monday–Wednesday." },
  { date: "2026-05-02", title: "Upcoming Sports Day Registration", category: "Event",  color: "green", body: "Parents wishing to participate in Sports Day must register by May 15." },
  { date: "2026-04-28", title: "Allergy Awareness Week",           category: "Health", color: "amber", body: "This week we raise awareness about food allergies. No nut products on campus." },
];
const NOTICE_COLORS: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-400",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

export default function SchoolSection({ tab, enrollments }: { tab: string; enrollments: Enrollment[] }) {
  const today = new Date().toISOString().split("T")[0];

  // ── TIMETABLE ──────────────────────────────────────────────────────────────
  if (tab === "timetable") {
    return <TimetableEditor />;
  }

  // ── ATTENDANCE ─────────────────────────────────────────────────────────────
  if (tab === "attendance") {
    const accepted = enrollments
      .filter((e) => e.status === "accepted")
      .map((e) => ({ id: e.id, first: e.child_first_name, last: e.child_last_name, grade: e.applying_for_grade }));
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Attendance</h1>
        <AttendanceView students={accepted} />
      </div>
    );
  }

  // ── CLASSES ────────────────────────────────────────────────────────────────
  if (tab === "classes") {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Classes</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GRADES.map(({ key, label, age, color }) => {
            const c = GRADE_COLORS[color];
            const acceptedStudents = enrollments.filter((e) => e.applying_for_grade === key && e.status === "accepted");
            const enrolled = acceptedStudents.length;
            const pending  = enrollments.filter((e) => e.applying_for_grade === key && e.status === "pending").length;
            const pct    = Math.min(Math.round((enrolled / CLASS_LIMIT) * 100), 100);
            const full   = enrolled >= CLASS_LIMIT;
            const almost = enrolled >= CLASS_LIMIT - 3 && !full;
            const shown  = acceptedStudents.slice(0, 6);
            const extra  = enrolled - shown.length;
            return (
              <div key={key} className={`glass-card p-5 ring-1 ${c.ring}`}>
                {/* header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold mb-2 ${c.bg} ${c.text}`}>{label}</div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs">{age}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${full ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : almost ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"}`}>
                    {full ? "Full" : almost ? "Almost Full" : "Available"}
                  </span>
                </div>

                {/* progress */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Enrolled</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{enrolled} / {CLASS_LIMIT}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${c.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-white/8 text-center">
                  <div>
                    <p className="text-base font-bold text-slate-800 dark:text-white">{enrolled}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Enrolled</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-amber-600 dark:text-amber-400">{pending}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Pending</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-400 dark:text-slate-500">{CLASS_LIMIT - enrolled}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Open seats</p>
                  </div>
                </div>

                {/* student roster */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/8">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Students</p>
                  {enrolled === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No accepted students yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {shown.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${c.bg} ${c.text}`}>
                            {i + 1}
                          </span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                            {s.child_first_name} {s.child_last_name}
                          </span>
                        </div>
                      ))}
                      {extra > 0 && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-7">+{extra} more student{extra > 1 ? "s" : ""}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── TEACHERS ───────────────────────────────────────────────────────────────
  if (tab === "teachers") {
    return <TeachersSection />;
  }

  // ── EVENTS ─────────────────────────────────────────────────────────────────
  if (tab === "events") {
    const upcomingVisits = enrollments
      .filter((e) => e.visit_date && e.visit_date >= today)
      .sort((a, b) => (a.visit_date! > b.visit_date! ? 1 : -1))
      .slice(0, 5);

    const allEvents = [
      ...SCHOOL_EVENTS.map((e) => ({ ...e, subtitle: undefined as string | undefined })),
      ...upcomingVisits.map((e) => ({
        date: e.visit_date!,
        title: `Campus Visit — ${e.child_first_name} ${e.child_last_name}`,
        type: "Visit", color: "blue",
        subtitle: `${e.parent1_full_name} · ${e.visit_time ?? "Time TBC"}`,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Events & Calendar</h1>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            Add Event
          </button>
        </div>
        <div className="glass-card divide-y divide-slate-100 dark:divide-white/6 overflow-hidden">
          {allEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No upcoming events.</div>
          ) : allEvents.map((e, i) => {
            const d = new Date(e.date + "T00:00");
            const isPast = e.date < today;
            return (
              <div key={i} className={`flex items-start gap-4 px-5 py-4 ${isPast ? "opacity-50" : ""}`}>
                <div className="text-center shrink-0 w-12">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{d.toLocaleDateString("en", { month: "short" })}</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{d.getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{e.title}</p>
                  {e.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{e.subtitle}</p>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${EVENT_COLORS[e.color] ?? EVENT_COLORS.blue}`}>{e.type}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── NOTICEBOARD ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Noticeboard</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Post Announcement
        </button>
      </div>
      <div className="space-y-4">
        {NOTICES.map((n, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{n.title}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${NOTICE_COLORS[n.color]}`}>{n.category}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.date}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{n.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">Sample data — connect a database to persist announcements.</p>
    </div>
  );
}
