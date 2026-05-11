import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";
import EnrollmentForm from "@/components/EnrollmentForm";

export default async function AddStudentPage() {
  const session = await getSession();
  if (!session || !["admin", "super_admin", "staff"].includes(session.role)) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/admin?section=school&tab=students"
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Students
          </Link>
          <span className="text-slate-300 dark:text-white/20">/</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-white">Add Student</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f1f6b] dark:text-white">Register New Student</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fill in the enrollment form below. The student will be saved as <strong>Pending</strong> and follow the standard review process.
          </p>
        </div>

        <EnrollmentForm apiEndpoint="/api/admin/enroll" />
      </div>
    </div>
  );
}
