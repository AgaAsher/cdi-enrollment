import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSettings, upsertSettings } from "@/lib/settings";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await getSettings();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await upsertSettings(body);
  return NextResponse.json({ ok: true });
}
