import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

type SlotCell = { subject: string; teacher: string; room: string; group: string; groupLabel: string; isFixed: boolean };
type GRow = { time: string; duration: string; color: string; cells: SlotCell[][] };
type ClassOut = { label: string; rows: GRow[] };
type TimetableData = Record<string, ClassOut>;

export type TeacherLesson = {
  classLabel: string;
  classKey: string;
  subject: string;
  time: string;
  duration: string;
  color: string;
  dayIndex: number;
  room: string;
  groupLabel: string;
};

export type TeacherRow = {
  time: string;
  duration: string;
  cells: Array<TeacherLesson | null>; // index = dayIndex 0-4
};

function timeToMin(t: string): number {
  const [h, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  // Use timetable_name from profile if admin linked it, otherwise fall back to account name
  const { data: userRow } = await supabase
    .from("admin_users")
    .select("profile")
    .eq("email", session.email)
    .maybeSingle();

  const profile = (userRow?.profile ?? {}) as Record<string, string>;
  const teacherName: string = profile.timetable_name ?? session.name;

  const { data } = await supabase
    .from("published_timetables")
    .select("timetable_data")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ teacherName, rows: [] });

  const timetable = data.timetable_data as TimetableData;

  // Map from slot time → lesson per day
  const rowTimes = new Map<string, { duration: string }>();
  const grid = new Map<string, TeacherLesson>(); // key: `${time}-${dayIndex}`

  for (const [classKey, cls] of Object.entries(timetable)) {
    for (const row of cls.rows) {
      if (!rowTimes.has(row.time)) {
        rowTimes.set(row.time, { duration: row.duration });
      }
      for (let d = 0; d < 5; d++) {
        for (const cell of row.cells[d] ?? []) {
          if (!cell.isFixed && cell.teacher === teacherName) {
            grid.set(`${row.time}-${d}`, {
              classLabel: cls.label,
              classKey,
              subject: cell.subject,
              time: row.time,
              duration: row.duration,
              color: row.color,
              dayIndex: d,
              room: cell.room || "",
              groupLabel: cell.groupLabel || "",
            });
          }
        }
      }
    }
  }

  const rows: TeacherRow[] = [...rowTimes.entries()]
    .sort(([a], [b]) => timeToMin(a) - timeToMin(b))
    .map(([time, { duration }]) => ({
      time,
      duration,
      cells: [0, 1, 2, 3, 4].map(d => grid.get(`${time}-${d}`) ?? null),
    }));

  return NextResponse.json({ teacherName, rows });
}
