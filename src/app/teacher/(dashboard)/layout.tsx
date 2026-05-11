import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import TeacherHeader from "./TeacherHeader";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "teacher") redirect("/admin");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117]">
      <TeacherHeader
        name={session.name}
        currentRole={session.role}
        availableRoles={session.roles ?? [session.role]}
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
