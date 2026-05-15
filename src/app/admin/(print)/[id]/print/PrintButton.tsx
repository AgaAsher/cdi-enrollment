"use client";

import { useRouter } from "next/navigation";

export default function PrintButton({ backUrl }: { backUrl: string }) {
  const router = useRouter();
  return (
    <div className="no-print" style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
      <button
        onClick={() => router.push(backUrl)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "white", border: "1px solid #cbd5e1", color: "#475569",
          fontSize: "14px", fontWeight: 600, padding: "8px 20px", borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>
      <button
        onClick={() => window.print()}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "#1e3a8a", border: "none", color: "white",
          fontSize: "14px", fontWeight: 600, padding: "8px 20px", borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ⬇ Save as PDF / Print
      </button>
    </div>
  );
}
