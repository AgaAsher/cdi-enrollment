import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import TeacherHeader from "./TeacherHeader";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "teacher") redirect("/admin");

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0d1117]">
      <TeacherHeader
        name={session.name}
        currentRole={session.role}
        availableRoles={session.roles ?? [session.role]}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
