import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Enrollment } from "@/lib/types";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import AdminHeader from "@/components/AdminHeader";
import { AdminLangProvider } from "@/components/AdminLangProvider";

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
    <AdminLangProvider>
      <div className="min-h-screen flex flex-col">
        <AdminHeader />

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
    </AdminLangProvider>
  );
}
