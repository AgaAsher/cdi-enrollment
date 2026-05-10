import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Enrollment } from "@/lib/types";
import ParentTimetable from "./ParentTimetable";
import CollapsibleSection from "./CollapsibleSection";

const SCHOOL_EVENTS = [
  { date: "2026-05-15", title: "Parent–Teacher Meeting",   type: "Meeting",  color: "blue"   },
  { date: "2026-05-20", title: "Sports Day",               type: "Activity", color: "green"  },
  { date: "2026-06-01", title: "Children's Day Parade",    type: "Festival", color: "pink"   },
  { date: "2026-06-10", title: "Art Exhibition",           type: "Showcase", color: "violet" },
];

const EVENT_COLORS: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  green:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  pink:   "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  amber:  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

const NOTICES = [
  { date: "2026-05-06", title: "School Uniform Reminder",  category: "Admin",  body: "Please ensure all students wear full uniform every Monday–Wednesday." },
  { date: "2026-05-02", title: "Sports Day Registration",  category: "Event",  body: "Parents wishing to participate in Sports Day must register by May 15." },
  { date: "2026-04-28", title: "Allergy Awareness Week",   category: "Health", body: "No nut products on campus this week." },
];

function gradeShort(gradeKey: string): string {
  if (gradeKey.startsWith("Toddler"))   return "Toddler";
  if (gradeKey.startsWith("Nursery"))   return "Nursery";
  if (gradeKey.startsWith("Reception")) return "Reception";
  if (gradeKey.startsWith("Pre-KG"))    return "Pre-KG";
  return gradeKey;
}

type FeedbackEntry = {
  id: string;
  enrollment_id: string;
  teacher_name: string;
  class_label: string;
  category: string;
  content: string;
  created_at: string;
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

type SlotCell = { subject: string; teacher: string; room: string; isFixed: boolean };
type TimetableRow = { time: string; duration: string; color: string; cells: SlotCell[][] };
type ClassOut = { label: string; rows: TimetableRow[] };
type TimetableData = Record<string, ClassOut>;

function findClassRows(data: TimetableData, gradeKey: string): TimetableRow[] | null {
  const short = gradeShort(gradeKey);
  const byLabel = Object.values(data).find(c => c.label.toLowerCase() === short.toLowerCase());
  if (byLabel) return byLabel.rows;
  const byKey = Object.entries(data).find(([k]) => k.toLowerCase() === short.toLowerCase());
  if (byKey) return byKey[1].rows;
  return null;
}

type AttendanceRecord = { student_id: string; status: "present" | "absent" };
type AttendanceRow = { date: string; records: AttendanceRecord[] | null };

async function fetchAttendanceSummary(
  supabase: ReturnType<typeof createAdminClient>,
  grade: string,
  studentId: string,
): Promise<{ present: number; absent: number }> {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split("T")[0];
  const toDate = today.toISOString().split("T")[0];

  const { data } = await supabase
    .from("attendance")
    .select("date, records")
    .eq("class_label", grade)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date", { ascending: false })
    .limit(30);

  const rows = (data ?? []) as AttendanceRow[];
  let present = 0;
  let absent = 0;

  for (const row of rows) {
    if (!Array.isArray(row.records)) continue;
    const record = row.records.find((r) => r.student_id === studentId);
    if (!record) continue;
    if (record.status === "present") present++;
    else if (record.status === "absent") absent++;
  }

  return { present, absent };
}

export default async function ParentDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/admin/login");

  const enrollmentIds = session.enrollment_ids ?? [];
  const firstName = session.name.split(" ")[0];

  const supabase = createAdminClient();

  // Fetch child enrollments
  let children: Enrollment[] = [];
  if (enrollmentIds.length > 0) {
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .in("id", enrollmentIds);
    children = (data ?? []) as Enrollment[];
  }

  // Fetch attendance for each child
  const attendanceSummaries = await Promise.all(
    children.map((child) =>
      fetchAttendanceSummary(supabase, child.applying_for_grade, child.id)
    )
  );

  // Fetch published timetable
  const { data: ttData } = await supabase
    .from("published_timetables")
    .select("timetable_data")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const timetableData = (ttData?.timetable_data ?? null) as TimetableData | null;

  // Fetch feedback for all linked children
  let allFeedback: FeedbackEntry[] = [];
  if (enrollmentIds.length > 0) {
    const { data: feedbackData } = await supabase
      .from("student_feedback")
      .select("*")
      .in("enrollment_id", enrollmentIds)
      .order("created_at", { ascending: false });
    allFeedback = (feedbackData ?? []) as FeedbackEntry[];
  }

  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = SCHOOL_EVENTS.filter((e) => e.date >= today).slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f1f6b] dark:text-white">
          Welcome, {firstName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Here&apos;s an overview of your child{children.length !== 1 ? "ren" : ""}&apos;s progress.
        </p>
      </div>

      {/* Children cards */}
      {children.length === 0 ? (
        <div className="bg-white dark:bg-[#1a2035] rounded-2xl p-8 text-center border border-slate-100 dark:border-white/8 shadow-sm">
          <p className="text-slate-400 dark:text-slate-500 text-sm">No enrolled children found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child, idx) => {
            const att = attendanceSummaries[idx];
            const grade = gradeShort(child.applying_for_grade);
            const initials =
              (child.child_first_name?.[0] ?? "").toUpperCase() +
              (child.child_last_name?.[0] ?? "").toUpperCase();
            return (
              <div
                key={child.id}
                className="bg-white dark:bg-[#1a2035] rounded-2xl p-6 border border-slate-100 dark:border-white/8 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{initials}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                      {child.child_first_name} {child.child_last_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300">
                        {grade}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{child.academic_year}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="border-t border-slate-100 dark:border-white/8 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">
                    Attendance — Last 30 Days
                  </p>
                  {att.present === 0 && att.absent === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No attendance records found.</p>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{att.present}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{att.absent}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">Absent</span>
                      </div>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden ml-2">
                        {att.present + att.absent > 0 && (
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.round((att.present / (att.present + att.absent)) * 100)}%` }}
                          />
                        )}
                      </div>
                      {att.present + att.absent > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                          {Math.round((att.present / (att.present + att.absent)) * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Teacher feedback */}
                {(() => {
                  const childFeedback = allFeedback
                    .filter(f => f.enrollment_id === child.id)
                    .slice(0, 5);
                  if (childFeedback.length === 0) return null;
                  return (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/8">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">
                        Teacher Feedback
                      </p>
                      <div className="space-y-3">
                        {childFeedback.map(entry => (
                          <div key={entry.id} className="bg-slate-50 dark:bg-white/4 rounded-xl p-3.5">
                            <div className="flex items-center gap-2 mb-1.5">
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
                  );
                })()}

                {/* Timetable */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/8">
                  <ParentTimetable
                    gradeLabel={gradeShort(child.applying_for_grade)}
                    rows={timetableData ? (findClassRows(timetableData, child.applying_for_grade) ?? []) : null}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Events */}
      <CollapsibleSection title="Upcoming Events" defaultOpen={true}>
        <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-100 dark:border-white/8 shadow-sm divide-y divide-slate-100 dark:divide-white/6 overflow-hidden">
          {upcomingEvents.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No upcoming events.</div>
          ) : (
            upcomingEvents.map((ev, i) => {
              const d = new Date(ev.date + "T00:00");
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="text-center shrink-0 w-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{d.toLocaleDateString("en", { month: "short" })}</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white leading-none">{d.getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{ev.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${EVENT_COLORS[ev.color] ?? EVENT_COLORS.blue}`}>
                    {ev.type}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CollapsibleSection>

      {/* Noticeboard */}
      <CollapsibleSection title="Noticeboard" defaultOpen={true}>
        <div className="space-y-3">
          {NOTICES.map((n, i) => (
            <div key={i} className="bg-white dark:bg-[#1a2035] rounded-2xl p-5 border border-slate-100 dark:border-white/8 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{n.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400">
                    {n.category}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.date}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{n.body}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
