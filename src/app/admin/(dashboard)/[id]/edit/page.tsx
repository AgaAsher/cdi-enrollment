import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { Enrollment } from "@/lib/types";
import Link from "next/link";
import EditForm from "./EditForm";

export default async function EditEnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.permissions?.students_edit) redirect("/admin");
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("enrollments").select("*").eq("id", id).single();
  if (!data) notFound();
  const e = data as Enrollment;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/${id}`} className="text-blue-700 hover:text-blue-900 text-sm">
            ← Back to profile
          </Link>
          <h1 className="text-xl font-bold text-slate-800 mt-1">
            Edit — {e.child_first_name} {e.child_last_name}
          </h1>
        </div>
      </div>
      <EditForm enrollment={e} />
    </div>
  );
}
