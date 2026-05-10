"use client";

import { useState } from "react";

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        background: "rgba(10, 25, 70, 0.30)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 32px rgba(0,0,0,0.35)",
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-5 py-4 transition-colors hover:bg-white/5"
      >
        <h2 className="text-base font-bold text-white">{title}</h2>
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
             style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <svg
            className={`w-4 h-4 text-white/70 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          {children}
        </div>
      )}
    </div>
  );
}
