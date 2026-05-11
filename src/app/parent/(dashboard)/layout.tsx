import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ParentLangProvider } from "@/components/ParentLangProvider";
import ParentHeader from "./ParentHeader";

export default async function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "parent") redirect("/");

  return (
    <ParentLangProvider>
      <div className="h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0d1117]">
        <ParentHeader
          currentRole={session.role}
          availableRoles={session.roles ?? [session.role]}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </ParentLangProvider>
  );
}
