import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";

function superAdminOnly(session: Awaited<ReturnType<typeof getSession>>) {
  return !session || session.role !== "super_admin";
}

// GET /api/admin/branches — list all branches
export async function GET() {
  const session = await getSession();
  if (!session || !["super_admin", "admin", "staff", "teacher"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, code, address, active")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ branches: data ?? [] });
}

// POST /api/admin/branches — create branch (super_admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (superAdminOnly(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json() as { name?: string; code?: string; address?: string };
  if (!body.name?.trim() || !body.code?.trim()) {
    return NextResponse.json({ error: "name and code are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({ name: body.name.trim(), code: body.code.trim().toUpperCase(), address: body.address?.trim() ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ branch: data }, { status: 201 });
}

// PATCH /api/admin/branches — update branch (super_admin only)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (superAdminOnly(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json() as { id?: string; name?: string; code?: string; address?: string; active?: boolean };
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.name    !== undefined) updates.name    = body.name.trim();
  if (body.code    !== undefined) updates.code    = body.code.trim().toUpperCase();
  if (body.address !== undefined) updates.address = body.address?.trim() ?? null;
  if (body.active  !== undefined) updates.active  = body.active;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("branches")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ branch: data });
}

// DELETE /api/admin/branches — deactivate branch (super_admin only)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (superAdminOnly(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("branches").update({ active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
