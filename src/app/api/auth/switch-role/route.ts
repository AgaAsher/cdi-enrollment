import { NextRequest, NextResponse } from "next/server";
import { getSession, createSessionToken, sessionCookieOptions, SessionPayload } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLE_ROUTES: Record<string, string> = {
  super_admin: "/admin",
  admin:       "/admin",
  staff:       "/admin",
  teacher:     "/teacher",
  parent:      "/parent",
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role } = await req.json() as { role: string };
  if (!role) return NextResponse.json({ error: "role is required" }, { status: 400 });

  const availableRoles = session.roles ?? [session.role];
  if (!availableRoles.includes(role)) {
    return NextResponse.json({ error: "Role not available for this account" }, { status: 403 });
  }
  if (role === session.role) {
    return NextResponse.json({ redirectTo: ROLE_ROUTES[role] ?? "/" });
  }

  // Re-fetch to get fresh permissions / enrollment_ids for the new role
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("admin_users")
    .select("permissions, enrollment_ids, roles")
    .eq("email", session.email)
    .eq("active", true)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const token = createSessionToken({
    email:          session.email,
    name:           session.name,
    role:           role as SessionPayload["role"],
    roles:          (user.roles as string[] | null) ?? availableRoles,
    permissions:    (user.permissions as Record<string, boolean>) ?? {},
    enrollment_ids: (user.enrollment_ids as string[] | null) ?? [],
  });

  const redirectTo = ROLE_ROUTES[role] ?? "/";
  const res = NextResponse.json({ redirectTo });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
