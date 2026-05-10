import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollmentIds = session.enrollment_ids ?? [];
  if (enrollmentIds.length === 0) return NextResponse.json({ feedback: [] });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("student_feedback")
    .select("*")
    .in("enrollment_id", enrollmentIds)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data ?? [] });
}
