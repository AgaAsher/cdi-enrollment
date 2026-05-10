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
        <ParentHeader />
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </div>
    </ParentLangProvider>
  );
}
