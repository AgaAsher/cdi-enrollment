import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Image from "next/image";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "teacher") redirect("/admin");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm p-1 shrink-0 border border-slate-100">
              <Image src="/logo.png" alt="CDI" width={36} height={36} className="object-contain w-full h-full" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f1f6b] leading-none">CDI International School</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Teacher Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 leading-none">{session.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Teacher</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
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
