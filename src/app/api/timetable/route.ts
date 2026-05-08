import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("published_timetables")
    .select("*")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ timetable: data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { timetable_data, academic_year } = body;
  if (!timetable_data) return NextResponse.json({ error: "Missing timetable_data" }, { status: 400 });

  const supabase = createAdminClient();

  // Deactivate previous
  await supabase.from("published_timetables").update({ is_active: false }).eq("is_active", true);

  // Insert new active timetable
  const { error } = await supabase.from("published_timetables").insert({
    timetable_data,
    academic_year: academic_year ?? "2025-2026",
    is_active: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
