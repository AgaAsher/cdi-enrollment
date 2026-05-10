import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Enrollment } from "@/lib/types";
import ParentDashboardContent from "./ParentDashboardContent";

const SCHOOL_EVENTS = [
  { date: "2026-05-15", title: "Parent–Teacher Meeting",   type: "Meeting",  color: "blue"   },
  { date: "2026-05-20", title: "Sports Day",               type: "Activity", color: "green"  },
  { date: "2026-06-01", title: "Children's Day Parade",    type: "Festival", color: "pink"   },
  { date: "2026-06-10", title: "Art Exhibition",           type: "Showcase", color: "violet" },
];

const NOTICES = [
  { date: "2026-05-06", title: "School Uniform Reminder",  category: "Admin",  body: "Please ensure all students wear full uniform every Monday–Wednesday." },
  { date: "2026-05-02", title: "Sports Day Registration",  category: "Event",  body: "Parents wishing to participate in Sports Day must register by May 15." },
  { date: "2026-04-28", title: "Allergy Awareness Week",   category: "Health", body: "No nut products on campus this week." },
];

type FeedbackEntry = {
  id: string; enrollment_id: string; teacher_name: string;
  class_label: string; category: string; content: string; created_at: string;
};

type SlotCell = { subject: string; teacher: string; room: string; isFixed: boolean };
type TimetableRow = { time: string; duration: string; color: string; cells: SlotCell[][] };
type ClassOut = { label: string; rows: TimetableRow[] };
type TimetableData = Record<string, ClassOut>;

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

  const { data } = await supabase
    .from("attendance")
    .select("date, records")
    .eq("class_label", grade)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .lte("date", today.toISOString().split("T")[0])
    .order("date", { ascending: false })
    .limit(30);

  const rows = (data ?? []) as AttendanceRow[];
  let present = 0, absent = 0;
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
  if (!session || session.role !== "parent") redirect("/");

  const enrollmentIds = session.enrollment_ids ?? [];
  const firstName = session.name.split(" ")[0];
  const supabase = createAdminClient();

  let children: Enrollment[] = [];
  if (enrollmentIds.length > 0) {
    const { data } = await supabase.from("enrollments").select("*").in("id", enrollmentIds);
    children = (data ?? []) as Enrollment[];
  }

  const attendanceSummaries = await Promise.all(
    children.map((child) => fetchAttendanceSummary(supabase, child.applying_for_grade, child.id))
  );

  const { data: ttData } = await supabase
    .from("published_timetables").select("timetable_data")
    .eq("is_active", true).order("published_at", { ascending: false }).limit(1).maybeSingle();
  const timetableData = (ttData?.timetable_data ?? null) as TimetableData | null;

  let allFeedback: FeedbackEntry[] = [];
  if (enrollmentIds.length > 0) {
    const { data: feedbackData } = await supabase
      .from("student_feedback").select("*")
      .in("enrollment_id", enrollmentIds).order("created_at", { ascending: false });
    allFeedback = (feedbackData ?? []) as FeedbackEntry[];
  }

  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = SCHOOL_EVENTS.filter((e) => e.date >= today).slice(0, 4);

  const nowDate = new Date();
  const dow = nowDate.getDay();
  const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const todayDayName: string | null = dow >= 1 && dow <= 5 ? WEEK_DAYS[dow - 1] : null;
  const mondayOffset = nowDate.getDate() - dow + (dow === 0 ? -6 : 1);
  const mondayDate = new Date(nowDate);
  mondayDate.setDate(mondayOffset);
  const weekStart = mondayDate.toISOString().split("T")[0];

  const { data: menuRow } = await supabase
    .from("weekly_menus").select("menu_data").eq("week_start", weekStart).maybeSingle();
  const menuData = (menuRow?.menu_data ?? null) as Record<string, Record<string, string>> | null;

  return (
    <ParentDashboardContent
      firstName={firstName}
      children={children}
      attendanceSummaries={attendanceSummaries}
      allFeedback={allFeedback}
      timetableData={timetableData}
      menuData={menuData}
      todayDayName={todayDayName}
      upcomingEvents={upcomingEvents}
      notices={NOTICES}
    />
  );
}
