import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classLabel = req.nextUrl.searchParams.get("class") ?? "";

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id, child_first_name, child_last_name, applying_for_grade")
    .eq("status", "accepted")
    .ilike("applying_for_grade", `%${classLabel}%`)
    .order("child_last_name");

  const students = (data ?? []).map(s => ({
    id: s.id,
    name: `${s.child_first_name} ${s.child_last_name}`,
  }));

  return NextResponse.json({ students });
}
