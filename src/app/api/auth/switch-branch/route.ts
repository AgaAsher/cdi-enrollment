import { NextRequest, NextResponse } from "next/server";
import { getSession, createSessionToken, sessionCookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { branch_id } = await req.json() as { branch_id: string | null };

  const token = createSessionToken({
    ...session,
    active_branch_id: branch_id ?? null,
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
