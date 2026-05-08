import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = req.nextUrl.searchParams.get("role");
  const supabase = createAdminClient();
  let query = supabase
    .from("admin_users")
    .select("id, name, email, role, permissions, active, created_at, profile")
    .order("created_at", { ascending: true });

  if (role) query = query.eq("role", role);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.permissions?.users) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password, role, permissions } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_users").insert({
    name,
    email,
    password_hash: hashPassword(password),
    role: role ?? "staff",
    permissions: permissions ?? {
      dashboard: true, students_view: true, students_edit: false,
      students_accept: false, visits: false, archive: false, reports: false, users: false,
    },
    active: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
