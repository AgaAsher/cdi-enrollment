import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ParentLangProvider } from "@/components/ParentLangProvider";
import ParentHeader from "./ParentHeader";

export default async function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/");

  return (
    <ParentLangProvider>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d1117]">
        <ParentHeader
          currentRole={session.role}
          availableRoles={session.roles ?? [session.role]}
        />
        <main>{children}</main>
      </div>
    </ParentLangProvider>
  );
}
