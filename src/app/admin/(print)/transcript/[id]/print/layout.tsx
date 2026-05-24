import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function TranscriptPrintLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return <>{children}</>;
}
