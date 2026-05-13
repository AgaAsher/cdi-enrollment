import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Enrollment } from "@/lib/types";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import AdminShell from "./AdminShell";
import AdminHeader from "@/components/AdminHeader";
import { AdminLangProvider } from "@/components/AdminLangProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role === "teacher") redirect("/teacher");

  const supabase = createAdminClient();

  // Fetch branches for super_admin
  const branches = session.role === "super_admin"
    ? ((await supabase.from("branches").select("id, name, code").eq("active", true).order("name")).data ?? [])
    : [];

  // Branch filter: super_admin scoped only when active_branch_id is set; others always scoped
  const branchFilter = session.role === "super_admin"
    ? (session.active_branch_id ?? null)
    : (session.branch_id ?? null);

  // Try with deleted_at filter; fall back if the column doesn't exist yet
  let enrollQuery = supabase
    .from("enrollments")
    .select("status, visit_date, deleted_at")
    .is("deleted_at", null);
  if (branchFilter) enrollQuery = enrollQuery.eq("branch_id", branchFilter);

  let { data: enrollments, error: enrollError } = await enrollQuery;

  if (enrollError) {
    let fallbackQ = supabase.from("enrollments").select("status, visit_date");
    if (branchFilter) fallbackQ = fallbackQ.eq("branch_id", branchFilter);
    const { data: fallback } = await fallbackQ;
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

  const sidebar = (
    <Suspense>
      <Sidebar
        counts={counts}
        visitCount={visitCount}
        permissions={session.permissions}
        isSuperAdmin={session.role === "super_admin"}
      />
    </Suspense>
  );

  return (
    <AdminLangProvider>
      <div className="h-screen flex flex-col">
        <AdminHeader
          currentRole={session.role}
          availableRoles={session.roles ?? [session.role]}
          branches={session.role === "super_admin" ? branches : undefined}
          activeBranchId={session.active_branch_id ?? null}
        />
        <AdminShell sidebar={sidebar}>
          {children}
        </AdminShell>
      </div>
    </AdminLangProvider>
  );
}
