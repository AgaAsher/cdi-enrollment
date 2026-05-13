"use client";

import { useRef, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

export type BranchOption = { id: string; name: string; code: string };

export default function BranchToggle({
  activeBranchId: initialActiveBranchId,
}: {
  branches?: BranchOption[];   // kept for API compat but unused — we fetch live
  activeBranchId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(initialActiveBranchId);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch branches fresh each time the dropdown opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/branches")
      .then((r) => r.json())
      .then((j) => setBranches((j.branches ?? []).filter((b: BranchOption & { active: boolean }) => b.active)));
  }, [open]);

  const active = branches.find((b) => b.id === activeBranchId) ?? null;

  async function switchBranch(id: string | null) {
    setOpen(false);
    if (id === activeBranchId) return;
    setActiveBranchId(id);
    await fetch("/api/auth/switch-branch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch_id: id }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border border-white/20 text-white/80 hover:text-white hover:bg-white/10 transition-all disabled:opacity-60"
      >
        {/* Branch icon */}
        <svg className="w-3 h-3 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="hidden sm:inline">
          {active ? active.name : "All Branches"}
        </span>
        <span className="sm:hidden">
          {active ? active.code : "All"}
        </span>
        <svg
          className={`w-3 h-3 transition-transform opacity-60 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden shadow-xl border border-white/15 bg-[#1a2035] z-50">
          <div className="px-3 py-2 border-b border-white/8">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Switch branch
            </p>
          </div>

          {/* All Branches option */}
          <button
            onClick={() => switchBranch(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeBranchId === null
                ? "bg-blue-500/15 text-blue-300"
                : "text-slate-300 hover:bg-white/8"
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="flex-1 text-left">All Branches</span>
            {activeBranchId === null && (
              <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {branches.map((branch) => {
            const isActive = branch.id === activeBranchId;
            return (
              <button
                key={branch.id}
                onClick={() => switchBranch(branch.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-blue-500/15 text-blue-300"
                    : "text-slate-300 hover:bg-white/8"
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="flex-1 text-left">{branch.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{branch.code}</span>
                {isActive && (
                  <svg className="w-3 h-3 text-blue-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}

          {branches.length === 0 && (
            <p className="px-3 py-3 text-xs text-slate-500 text-center">No branches yet</p>
          )}
        </div>
      )}
    </div>
  );
}
