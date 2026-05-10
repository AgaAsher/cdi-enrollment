import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, "visit-slots", { limit: 60, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("visit_time")
    .eq("visit_date", date)
    .not("visit_time", "is", null);

  if (error) {
    console.error("visit-slots error:", error);
    return NextResponse.json({ error: "Could not load slot availability" }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const t = row.visit_time as string;
    if (t) counts[t] = (counts[t] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
