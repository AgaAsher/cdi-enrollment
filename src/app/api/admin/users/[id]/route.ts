import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/password";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !session.permissions?.users) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.name !== undefined) update.name = body.name;
  if (body.email !== undefined) update.email = body.email;
  if (body.role !== undefined) update.role = body.role;
  if (body.permissions !== undefined) update.permissions = body.permissions;
  if (body.active !== undefined) update.active = body.active;
  if (body.profile !== undefined) update.profile = body.profile;
  if (body.password) update.password_hash = hashPassword(body.password);

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_users").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !session.permissions?.users) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
