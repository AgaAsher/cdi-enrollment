import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  const res = NextResponse.redirect(
    new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL!),
    303
  );
  res.cookies.set(clearSessionCookie());
  return res;
}
