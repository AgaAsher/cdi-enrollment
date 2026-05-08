import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Enrollment } from "@/lib/types";
import { Suspense } from "react";
import Image from "next/image";
import Sidebar from "./Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role === "teacher") redirect("/teacher");

  const supabase = createAdminClient();

  // Try with deleted_at filter; fall back if the column doesn't exist yet
  let { data: enrollments, error: enrollError } = await supabase
    .from("enrollments")
    .select("status, visit_date, deleted_at")
    .is("deleted_at", null);

  if (enrollError) {
    const { data: fallback } = await supabase
      .from("enrollments")
      .select("status, visit_date");
    enrollments = fallback as typeof enrollments;
  }

  const list = (enrollments ?? []) as Pick<Enrollment, "status" | "visit_date">[];

  const counts = {
    all:      list.length,
    pending:  list.filter((e) => e.status === "pending").length,
    reviewed: list.filter((e) => e.status === "reviewed").length,
    accepted: list.filter((e) => e.status === "accepted").length,
    rejected: list.filter((e) => e.status === "rejected").length,
  };
  const visitCount = list.filter((e) => e.visit_date).length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header — dark glass */}
      <header className="glass-dark px-6 py-4 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl shrink-0 bg-white p-1.5 shadow-md">
            <Image src="/logo.png" alt="CDI" width={56} height={56} className="object-contain w-full h-full" />
          </div>
          <div>
            <p className="font-bold text-base leading-none tracking-tight text-[#0f1f6b] dark:text-white">Child Development Academy</p>
            <p className="text-[#0f1f6b]/50 text-sm mt-1 dark:text-white/40">Enrollment Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-[#0f1f6b]/60 hover:text-[#0f1f6b] text-xs font-medium px-3 py-1.5 rounded-full border border-[#0f1f6b]/15 hover:border-[#0f1f6b]/30 hover:bg-[#0f1f6b]/5 transition-all dark:text-white/60 dark:hover:text-white dark:border-white/15 dark:hover:border-white/30 dark:hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — light glass */}
        <aside className="glass-sidebar w-56 shrink-0 overflow-y-auto">
          <Suspense>
            <Sidebar counts={counts} visitCount={visitCount} permissions={session.permissions} />
          </Suspense>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 dark:bg-[#0d1117]">
          {children}
        </main>
      </div>
    </div>
  );
}
