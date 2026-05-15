import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLASS_LIMIT } from "@/app/admin/(dashboard)/classConfig";

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("enrollments")
    .select("applying_for_grade")
    .eq("status", "accepted");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.applying_for_grade] = (counts[row.applying_for_grade] ?? 0) + 1;
  }

  return NextResponse.json({ counts, limit: CLASS_LIMIT });
}
