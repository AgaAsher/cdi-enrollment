import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Image from "next/image";

export default async function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/");

  return (
    <div className="glass-context min-h-screen relative">

      {/* ── Background — same as sign-in page ─────────────────────────────── */}
      <div className="fixed inset-0 -z-10 scale-110">
        <Image src="/bg.jpg" alt="" fill priority className="object-cover object-center" style={{ filter: "blur(10px)" }} />
      </div>
      <div className="fixed inset-0 -z-10" style={{ background: "linear-gradient(160deg, rgba(0,10,20,0.52) 0%, rgba(0,5,15,0.48) 50%, rgba(0,15,30,0.50) 100%)" }} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="glass-dark sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/90 p-1 shadow-md shrink-0">
            <Image src="/logo.png" alt="CDA" width={36} height={36} className="object-contain w-full h-full" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-none">Child Development Academy</p>
            <p className="text-xs text-white/55 mt-0.5">Parent Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <form action="/api/auth/logout" method="POST">
            <button
              className="text-xs font-semibold text-white px-3 py-1.5 rounded-full transition-all"
              style={{
                backdropFilter: "blur(12px)",
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.28)",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
