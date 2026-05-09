import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "teacher") redirect("/admin");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <header className="bg-white dark:bg-[#1a2035] border-b border-slate-200 dark:border-white/10 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm p-1 shrink-0 border border-slate-100">
              <Image src="/logo.png" alt="CDA" width={36} height={36} className="object-contain w-full h-full" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0f1f6b] dark:text-white leading-none">CDA International School</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Teacher Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700 dark:text-white leading-none">{session.name}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Teacher</p>
            </div>
            <ThemeToggle />
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/15 hover:border-slate-300 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
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
