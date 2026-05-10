import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, name, email, enrollment_ids, active")
    .eq("role", "parent")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name?: string;
    email?: string;
    password?: string;
    enrollment_ids?: string[];
  };

  const { name, email, enrollment_ids } = body;
  const password = body.password;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if account already exists
  const { data: existing } = await supabase
    .from("admin_users")
    .select("id, password_hash")
    .eq("email", email)
    .eq("role", "parent")
    .single();

  if (existing) {
    // Update existing account
    const updatePayload: Record<string, unknown> = {
      name,
      enrollment_ids: enrollment_ids ?? [],
      active: true,
    };
    if (password) {
      updatePayload.password_hash = hashPassword(password);
    }
    const { error } = await supabase
      .from("admin_users")
      .update(updatePayload)
      .eq("id", existing.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Create new account
  if (!password) {
    return NextResponse.json({ error: "Password is required for new accounts" }, { status: 400 });
  }

  const { error } = await supabase.from("admin_users").insert({
    name,
    email,
    password_hash: hashPassword(password),
    role: "parent",
    permissions: {},
    enrollment_ids: enrollment_ids ?? [],
    active: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
