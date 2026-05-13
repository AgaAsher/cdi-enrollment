import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "cdi_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  email: string;
  name: string;
  role: "super_admin" | "admin" | "staff" | "teacher" | "parent";
  roles?: string[]; // all roles this account can switch between
  permissions: Record<string, boolean>;
  enrollment_ids?: string[];
  branch_id?: string | null;        // user's own branch (null for super_admin)
  active_branch_id?: string | null; // super_admin's current branch filter (null = all)
};

function sign(payload: SessionPayload): string {
  const secret = process.env.AUTH_SECRET!;
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token: string): SessionPayload | null {
  try {
    const secret = process.env.AUTH_SECRET!;
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expected = createHmac("sha256", secret).update(data).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return JSON.parse(Buffer.from(data, "base64url").toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }
}

export function createSessionToken(payload: SessionPayload): string {
  return sign(payload);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}
