import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Extract teacher names from the active published timetable
  const { data: ttData } = await supabase
    .from("published_timetables")
    .select("timetable_data")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const teacherNames = new Set<string>();
  if (ttData) {
    const timetable = ttData.timetable_data as Record<string, { rows: { cells: { teacher: string }[][] }[] }>;
    for (const cls of Object.values(timetable)) {
      for (const row of cls.rows) {
        for (const dayCells of row.cells) {
          for (const cell of dayCells ?? []) {
            if (cell.teacher) teacherNames.add(cell.teacher);
          }
        }
      }
    }
  }

  // Get admins/principals separately so they always appear
  const { data: adminData } = await supabase
    .from("admin_users")
    .select("name, role")
    .in("role", ["admin", "super_admin"])
    .eq("active", true)
    .order("name");

  const admins = (adminData ?? []).map(u => ({ name: u.name, title: "Principal / Admin" }));
  const adminNameSet = new Set(admins.map(a => a.name));

  // Teachers from timetable that aren't already listed as admin
  const teachers = [...teacherNames]
    .filter(n => !adminNameSet.has(n))
    .sort()
    .map(name => ({ name, title: "Teacher" }));

  return NextResponse.json({ teachers: [...admins, ...teachers] });
}
