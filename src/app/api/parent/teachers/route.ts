import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("name, role")
    .in("role", ["teacher", "admin", "super_admin"])
    .eq("active", true)
    .order("role")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const teachers = (data ?? []).map((u) => ({
    name: u.name,
    title: u.role === "super_admin" || u.role === "admin" ? "Principal / Admin" : "Teacher",
  }));

  return NextResponse.json({ teachers });
}
