import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Image from "next/image";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "teacher") redirect("/admin");

  return (
    <div className="glass-context min-h-screen relative">

      {/* ── Background — same as sign-in page ─────────────────────────────── */}
      <div className="fixed inset-0 -z-10 scale-110">
        <Image src="/bg.jpg" alt="" fill priority className="object-cover object-center" style={{ filter: "blur(10px)" }} />
      </div>
      <div className="fixed inset-0 -z-10" style={{ background: "linear-gradient(160deg, rgba(0,10,20,0.52) 0%, rgba(0,5,15,0.48) 50%, rgba(0,15,30,0.50) 100%)" }} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="glass-dark sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/90 p-1 shadow-md shrink-0">
              <Image src="/logo.png" alt="CDA" width={36} height={36} className="object-contain w-full h-full" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">CDA International School</p>
              <p className="text-[11px] text-white/50 mt-0.5">Teacher Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{session.name}</p>
              <p className="text-[11px] text-white/50 mt-0.5">Teacher</p>
            </div>
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
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
