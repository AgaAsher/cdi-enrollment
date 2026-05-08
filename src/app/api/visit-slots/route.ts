import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("visit_time")
    .eq("visit_date", date)
    .not("visit_time", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const t = row.visit_time as string;
    if (t) counts[t] = (counts[t] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
