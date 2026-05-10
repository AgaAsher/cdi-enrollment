import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollmentId = req.nextUrl.searchParams.get("enrollment_id");
  const classLabel = req.nextUrl.searchParams.get("class");

  const supabase = createAdminClient();
  let query = supabase
    .from("student_feedback")
    .select("*")
    .eq("teacher_name", session.name)
    .order("created_at", { ascending: false });

  if (enrollmentId) query = query.eq("enrollment_id", enrollmentId);
  if (classLabel) query = query.eq("class_label", classLabel);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ feedback: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { enrollment_id, class_label, category, content } = body;

  if (!enrollment_id || !class_label || !content?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("student_feedback")
    .insert({
      enrollment_id,
      teacher_name: session.name,
      class_label,
      category: category || "general",
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("student_feedback")
    .delete()
    .eq("id", id)
    .eq("teacher_name", session.name);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
