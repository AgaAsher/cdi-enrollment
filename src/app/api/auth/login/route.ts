import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/password";

const SUPER_ADMIN_PERMISSIONS = {
  dashboard: true,
  students_view: true, students_all: true, students_pending: true,
  students_reviewed: true, students_accepted: true, students_rejected: true,
  students_edit: true, students_accept: true,
  visits: true, archive: true, reports: true, users: true, school: true,
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Check super admin from env first
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = createSessionToken({
      email,
      name: "Super Admin",
      role: "super_admin",
      permissions: SUPER_ADMIN_PERMISSIONS,
    });
    const res = NextResponse.json({ success: true, redirectTo: "/admin" });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  }

  // Check DB users
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .eq("active", true)
    .single();

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = createSessionToken({
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions ?? {},
  });

  const redirectTo = user.role === "teacher" ? "/teacher" : "/admin";
  const res = NextResponse.json({ success: true, redirectTo });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
