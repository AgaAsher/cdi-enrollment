import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, teaching_hours, half_year_avg, final_avg, sort_order } = body;

  const update: Record<string, string | number | null> = {};
  if (name !== undefined) update.name = name;
  if (teaching_hours !== undefined) update.teaching_hours = teaching_hours;
  if (half_year_avg !== undefined) update.half_year_avg = half_year_avg;
  if (final_avg !== undefined) update.final_avg = final_avg;
  if (sort_order !== undefined) update.sort_order = sort_order;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transcript_courses")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("transcript_courses")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
