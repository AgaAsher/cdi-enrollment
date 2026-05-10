import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Image from "next/image";

export default async function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d1117]">
      <header className="bg-white dark:bg-[#1a2035] border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="CDA" width={40} height={40} className="rounded-xl" />
          <div>
            <p className="font-bold text-sm text-[#0f1f6b] dark:text-white">Child Development Academy</p>
            <p className="text-xs text-slate-500">Parent Portal</p>
          </div>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button className="text-xs text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/15 transition-all">
            Sign out
          </button>
        </form>
      </header>
      <main className="max-w-4xl mx-auto p-6">{children}</main>
    </div>
  );
}
