"use client";

import { useRouter } from "next/navigation";

export default function DoubleClickRow({ id, children }: { id: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      onDoubleClick={() => router.push(`/admin/${id}/edit`)}
      className="glass-row cursor-pointer group"
      title="Double-click to edit"
    >
      {children}
    </tr>
  );
}
