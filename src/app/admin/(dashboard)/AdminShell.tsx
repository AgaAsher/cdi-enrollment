"use client";

import { useState } from "react";

export default function AdminShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-1 overflow-hidden relative">

      {/* ── Mobile overlay ─────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar panel ──────────────────────────────────────────────── */}
      {/* Desktop: always visible fixed column */}
      {/* Mobile: slides in from left as a drawer */}
      <aside
        className={`
          glass-sidebar shrink-0 overflow-y-auto z-40
          fixed inset-y-0 left-0 w-72
          transition-transform duration-300 ease-in-out
          md:relative md:w-56 md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Drawer header (mobile only) */}
        <div className="flex items-center justify-between px-4 py-3 md:hidden border-b border-[#0f1f6b]/10 dark:border-white/10">
          <p className="text-sm font-bold text-[#0f1f6b] dark:text-white">Navigation</p>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#0f1f6b]/5 dark:hover:bg-white/10 text-[#0f1f6b]/60 dark:text-white/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Close drawer only when a nav link is clicked, not group toggles */}
        <div onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}>
          {sidebar}
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto dark:bg-[#0d1117] flex flex-col">

        {/* Mobile top bar with hamburger */}
        <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-[#1a2035] border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl text-[#0f1f6b]/60 dark:text-white/60 hover:bg-[#0f1f6b]/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="text-sm font-bold text-[#0f1f6b] dark:text-white">Admin Dashboard</p>
        </div>

        <div className="flex-1 p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
