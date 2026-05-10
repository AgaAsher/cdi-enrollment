import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPassword, constantTimeEqual } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";

const SUPER_ADMIN_PERMISSIONS = {
  dashboard: true,
  students_view: true, students_all: true, students_pending: true,
  students_reviewed: true, students_accepted: true, students_rejected: true,
  students_edit: true, students_accept: true,
  visits: true, archive: true, reports: true, users: true, school: true, settings: true,
};

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, "login", { limit: 10, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Check super admin from env first.
  // Prefer ADMIN_PASSWORD_HASH (scrypt). Fall back to ADMIN_PASSWORD (plain) only if hash not set.
  const envEmail = process.env.ADMIN_EMAIL ?? "";
  const envHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const envPlain = process.env.ADMIN_PASSWORD ?? "";

  if (envEmail && constantTimeEqual(email, envEmail)) {
    const passwordOk = envHash
      ? verifyPassword(password, envHash)
      : envPlain ? constantTimeEqual(password, envPlain) : false;

    if (passwordOk) {
      const token = createSessionToken({
        email: envEmail,
        name: "Super Admin",
        role: "super_admin",
        permissions: SUPER_ADMIN_PERMISSIONS,
      });
      const res = NextResponse.json({ success: true, redirectTo: "/admin" });
      res.cookies.set(sessionCookieOptions(token));
      return res;
    }
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
    enrollment_ids: user.enrollment_ids ?? [],
  });

  const redirectTo = user.role === "teacher" ? "/teacher" : user.role === "parent" ? "/parent" : "/admin";
  const res = NextResponse.json({ success: true, redirectTo });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
