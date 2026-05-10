import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekStart = req.nextUrl.searchParams.get("week");
  if (!weekStart) return NextResponse.json({ error: "Missing week" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("weekly_menus")
    .select("menu_data")
    .eq("week_start", weekStart)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ menu_data: data?.menu_data ?? null });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = session.permissions ?? {};
  if (!p.menu_edit && session.role !== "admin" && session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { week_start, menu_data } = await req.json();
  if (!week_start || !menu_data) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("weekly_menus")
    .upsert(
      { week_start, menu_data, created_by: session.name, updated_at: new Date().toISOString() },
      { onConflict: "week_start" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
