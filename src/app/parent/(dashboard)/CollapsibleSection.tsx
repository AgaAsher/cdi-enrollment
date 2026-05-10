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
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full group bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 mb-3 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
      >
        <h2 className="text-base font-bold text-slate-800 dark:text-white">{title}</h2>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${open ? "bg-slate-100 dark:bg-white/10" : "bg-slate-100 dark:bg-white/8"}`}>
          <svg
            className={`w-4 h-4 text-slate-500 dark:text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && children}
    </div>
  );
}
