import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("published_timetables")
    .select("timetable_data")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ teachers: [] });

  const names = new Set<string>();
  const timetable = data.timetable_data as Record<string, { rows: { cells: { teacher: string }[][] }[] }>;

  for (const cls of Object.values(timetable)) {
    for (const row of cls.rows) {
      for (const dayCells of row.cells) {
        for (const cell of dayCells ?? []) {
          if (cell.teacher) names.add(cell.teacher);
        }
      }
    }
  }

  return NextResponse.json({ teachers: [...names].sort() });
}
