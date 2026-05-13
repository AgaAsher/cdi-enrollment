import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = req.nextUrl.searchParams.get("role");
  const supabase = createAdminClient();

  const buildQuery = (withProfile: boolean) => {
    const cols = withProfile
      ? "id, name, email, role, permissions, active, created_at, profile, branch_id"
      : "id, name, email, role, permissions, active, created_at, branch_id";
    let q = supabase.from("admin_users").select(cols).order("created_at", { ascending: true });
    if (role) q = q.eq("role", role);
    return q;
  };

  let { data, error } = await buildQuery(true);

  // If the profile column doesn't exist yet, retry without it
  if (error && error.message.includes("profile")) {
    ({ data, error } = await buildQuery(false));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const isPrivileged =
    session?.permissions?.users ||
    session?.role === "admin" ||
    session?.role === "super_admin";
  if (!session || !isPrivileged) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name: string = body.name?.trim() ?? "";
  const email: string = (body.email ?? "").trim().toLowerCase();
  const password: string = body.password ?? "";
  const { role, permissions, active, profile, branch_id } = body;
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
    active: active ?? true,
    profile: profile ?? {},
    branch_id: branch_id ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
