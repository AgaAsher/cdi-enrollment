import { NextResponse, type NextRequest } from "next/server";

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function originAllowed(req: NextRequest): boolean {
  if (!STATE_CHANGING.has(req.method)) return true;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  if (!host) return false;

  const allowedHosts = new Set<string>([host]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      allowedHosts.add(new URL(appUrl).host);
    } catch { /* ignore */ }
  }

  const sourceUrl = origin ?? referer;
  if (!sourceUrl) {
    return process.env.NODE_ENV !== "production";
  }

  try {
    const sourceHost = new URL(sourceUrl).host;
    return allowedHosts.has(sourceHost);
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    if (!originAllowed(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
