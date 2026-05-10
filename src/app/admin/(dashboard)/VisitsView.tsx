"use client";

import Link from "next/link";
import { useAdminLang } from "@/components/AdminLangProvider";
import { type EnrollmentStatus } from "@/lib/types";
import { type AdminT } from "@/lib/i18n/admin";

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  pending:  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
  reviewed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  rejected: "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
};

const STATUS_DOT: Record<EnrollmentStatus, string> = {
  pending: "bg-amber-400", reviewed: "bg-blue-400", accepted: "bg-emerald-400", rejected: "bg-red-400",
};

const STATUS_LABEL_KEY: Record<EnrollmentStatus, keyof AdminT> = {
  pending: "statusPending", reviewed: "statusReviewed", accepted: "statusAccepted", rejected: "statusRejected",
};

type VisitRow = {
  id: string;
  child_first_name: string;
  child_last_name: string;
  applying_for_grade: string;
  parent1_full_name: string;
  parent1_phone: string;
  parent1_email: string;
  visit_date: string | null;
  visit_time: string | null;
  status: EnrollmentStatus;
};

export default function VisitsView({ visitRequests }: { visitRequests: VisitRow[] }) {
  const { t } = useAdminLang();
  const today = new Date().toISOString().split("T")[0];

  function StatusBadge({ status }: { status: EnrollmentStatus }) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
        {t[STATUS_LABEL_KEY[status]]}
      </span>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white mb-5">{t.visitRequests}</h1>
      <div className="glass-card overflow-hidden">
        {visitRequests.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">{t.noVisitRequests}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/4 border-b border-slate-100 dark:border-white/6">
                <tr>
                  {([t.child, t.grade, t.parent, t.contact, t.visitDate, t.time, t.status, ""] as string[]).map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/6">
                {visitRequests.map((e) => {
                  const isPast = e.visit_date! < today;
                  return (
                    <tr key={e.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isPast ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{e.child_first_name} {e.child_last_name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.applying_for_grade}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.parent1_full_name}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        <div>{e.parent1_phone}</div>
                        <div className="text-xs">{e.parent1_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${isPast ? "text-slate-400 dark:text-slate-500" : "text-blue-700 dark:text-blue-400"}`}>{e.visit_date}</span>
                        {isPast && <span className="ml-2 text-xs text-slate-400">({t.pastLabel})</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.visit_time ?? "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/${e.id}`} className="text-blue-700 hover:text-blue-900 font-medium">{t.view}</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
