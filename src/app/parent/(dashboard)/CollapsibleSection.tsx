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
        className="flex items-center justify-between w-full group mb-3"
      >
        <h2 className="text-base font-bold text-slate-800 dark:text-white">{title}</h2>
        <svg
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform group-hover:text-slate-600 dark:group-hover:text-slate-300 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && children}
    </div>
  );
}
