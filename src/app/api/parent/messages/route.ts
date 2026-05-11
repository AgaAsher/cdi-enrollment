import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to_teacher, body, child_name, enrollment_id } = await req.json();
  if (!to_teacher || !body?.trim() || !child_name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("parent_messages").insert({
    parent_name: session.name,
    child_name,
    enrollment_id: enrollment_id ?? "",
    to_teacher,
    body: body.trim(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
