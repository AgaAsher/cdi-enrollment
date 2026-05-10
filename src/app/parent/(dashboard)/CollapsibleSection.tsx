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
    <div className="bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
      >
        <h2 className="text-base font-bold text-slate-800 dark:text-white">{title}</h2>
        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
          <svg
            className={`w-4 h-4 text-slate-500 dark:text-slate-300 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-white/8">
          {children}
        </div>
      )}
    </div>
  );
}
