import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  const classLabel = searchParams.get("class");
  const subject = searchParams.get("subject");
  const time = searchParams.get("time");

  if (!date || !classLabel || !subject || !time) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("attendance")
    .select("records, updated_at")
    .eq("date", date)
    .eq("class_label", classLabel)
    .eq("subject", subject)
    .eq("slot_time", time)
    .eq("teacher_name", session.name)
    .maybeSingle();

  return NextResponse.json({ records: data?.records ?? null, updatedAt: data?.updated_at ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, class_label, subject, slot_time, records } = body;

  if (!date || !class_label || !subject || !slot_time || !Array.isArray(records)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("attendance").upsert(
    {
      date,
      class_label,
      subject,
      slot_time,
      teacher_name: session.name,
      records,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "date,class_label,subject,slot_time,teacher_name" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
