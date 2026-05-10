import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Enrollment } from "@/lib/types";
import { Suspense } from "react";
import Image from "next/image";
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
      <div className="glass-context min-h-screen flex flex-col relative">

        {/* ── Background — same as sign-in page ─────────────────────────────── */}
        <div className="fixed inset-0 -z-10 scale-110">
          <Image src="/bg.jpg" alt="" fill priority className="object-cover object-center" style={{ filter: "blur(10px)" }} />
        </div>
        <div className="fixed inset-0 -z-10" style={{ background: "linear-gradient(160deg, rgba(0,5,15,0.82) 0%, rgba(0,3,10,0.80) 50%, rgba(0,8,22,0.82) 100%)" }} />

        <AdminHeader />

        <div className="flex flex-1 overflow-hidden">
          <aside className="glass-sidebar w-56 shrink-0 overflow-y-auto">
            <Suspense>
              <Sidebar counts={counts} visitCount={visitCount} permissions={session.permissions} />
            </Suspense>
          </aside>

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminLangProvider>
  );
}
