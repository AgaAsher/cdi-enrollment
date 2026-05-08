"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Enrollment, EnrollmentStatus } from "@/lib/types";

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  pending:  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
  reviewed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  rejected: "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
};
const STATUS_DOT: Record<EnrollmentStatus, string> = {
  pending:  "bg-amber-400",
  reviewed: "bg-blue-400",
  accepted: "bg-emerald-400",
  rejected: "bg-red-400",
};

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const PAGE_SIZE = 20;

export default function StudentsList({
  enrollments,
  canEdit,
}: {
  enrollments: Enrollment[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ type: "single"; id: string; name: string } | { type: "bulk"; ids: string[] } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(enrollments.length / PAGE_SIZE));
  const pageItems  = enrollments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allIds = pageItems.map((e) => e.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function doDelete(ids: string[]) {
    setDeleting(true);
    setError(null);
    try {
      let res: Response;
      if (ids.length === 1) {
        res = await fetch(`/api/admin/enrollments/${ids[0]}`, { method: "DELETE" });
      } else {
        res = await fetch("/api/admin/enrollments/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = json.error ?? "Delete failed — make sure you ran the DB migration in Supabase.";
        setError(msg);
        setConfirm(null); // close modal so banner is visible
        return;
      }
      setSelected(new Set());
      setConfirm(null);
      startTransition(() => router.refresh());
    } catch {
      setError("Network error — delete failed.");
      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  }

  if (enrollments.length === 0) {
    return <div className="p-12 text-center text-slate-400">No enrollments found.</div>;
  }

  return (
    <>
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {canEdit && someSelected && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20">
          <span className="text-sm text-red-700 dark:text-red-300 font-medium">
            {selected.size} student{selected.size > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setConfirm({ type: "bulk", ids: [...selected] })}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected ({selected.size})
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/4 border-b border-slate-100 dark:border-white/6">
            <tr>
              {canEdit && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                  />
                </th>
              )}
              <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Child</th>
              <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Grade</th>
              <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Parent</th>
              <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Contact</th>
              <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Submitted</th>
              <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/6">
            {pageItems.map((e) => {
              const isSelected = selected.has(e.id);
              return (
                <tr
                  key={e.id}
                  className={`group transition-colors ${isSelected ? "bg-red-50/60 dark:bg-red-500/8" : "hover:bg-slate-50/60 dark:hover:bg-white/3"}`}
                >
                  {canEdit && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(e.id)}
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                    {e.child_first_name} {e.child_last_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.applying_for_grade}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.parent1_full_name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    <div>{e.parent1_phone}</div>
                    <div className="text-xs">{e.parent1_email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={e.status === "accepted" ? `/admin/${e.id}/print` : `/admin/${e.id}`}
                        className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 font-medium text-sm whitespace-nowrap"
                      >
                        {e.status === "accepted" ? "Preview PDF →" : "View →"}
                      </Link>
                      {canEdit && (
                        <button
                          onClick={() =>
                            setConfirm({
                              type: "single",
                              id: e.id,
                              name: `${e.child_first_name} ${e.child_last_name}`,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete student"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/6">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, enrollments.length)} of {enrollments.length} students
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                  p === page
                    ? "bg-[#0f1f6b] text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141c2e] rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">Delete Student{confirm.type === "bulk" ? "s" : ""}?</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {confirm.type === "single"
                    ? `"${confirm.name}" will be moved to Archive.`
                    : `${confirm.ids.length} student${confirm.ids.length > 1 ? "s" : ""} will be moved to Archive.`}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">
              All information is preserved and marked as <strong>Deleted</strong> in the Archive.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirm.type === "single" ? [confirm.id] : confirm.ids)}
                disabled={deleting || pending}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
