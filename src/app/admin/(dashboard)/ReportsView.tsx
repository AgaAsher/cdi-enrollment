"use client";

import { useAdminLang } from "@/components/AdminLangProvider";
import { type EnrollmentStatus } from "@/lib/types";

type Props = {
  counts: Record<string, number>;
  gradeRows: [string, number][];
  nationalityRows: [string, number][];
  visitCount: number;
  upcomingVisitCount: number;
  pastVisitCount: number;
  socialMediaGiven: number;
  socialMediaNotGiven: number;
  postersGiven: number;
  postersNotGiven: number;
};

const REPORT_STATS: { key: EnrollmentStatus; color: string; bar: string; bg: string }[] = [
  { key: "pending",  color: "text-amber-500",   bar: "bg-amber-400",   bg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/20" },
  { key: "reviewed", color: "text-blue-500",    bar: "bg-blue-500",    bg: "bg-blue-500/10 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/20" },
  { key: "accepted", color: "text-emerald-500", bar: "bg-emerald-500", bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/20" },
  { key: "rejected", color: "text-red-500",     bar: "bg-red-500",     bg: "bg-red-500/10 dark:bg-red-500/15 border-red-200 dark:border-red-500/20" },
];

const STATUS_LABEL = { pending: "statusPending", reviewed: "statusReviewed", accepted: "statusAccepted", rejected: "statusRejected" } as const;

export default function ReportsView({ counts, gradeRows, nationalityRows, visitCount, upcomingVisitCount, pastVisitCount, socialMediaGiven, socialMediaNotGiven, postersGiven, postersNotGiven }: Props) {
  const { t } = useAdminLang();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">{t.reports}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {REPORT_STATS.map(({ key, color, bar, bg }) => {
          const pct = counts.all > 0 ? Math.round((counts[key] / counts.all) * 100) : 0;
          return (
            <div key={key} className={`glass-card p-5 border ${bg}`}>
              <p className={`text-4xl font-bold ${color}`}>{counts[key]}</p>
              <p className={`text-sm font-medium mt-1 ${color}`}>{t[STATUS_LABEL[key]]}</p>
              <div className="mt-3 h-1.5 bg-black/8 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{pct}{t.pctOfTotal}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">{t.applicationsByGrade}</h3>
          {gradeRows.length === 0 ? <p className="text-slate-400 text-sm">{t.noData}</p> : (
            <div className="space-y-3">
              {gradeRows.map(([grade, count]) => (
                <div key={grade}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300">{grade}</span>
                    <span className="font-bold text-slate-800 dark:text-white">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((count / counts.all) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">{t.applicationsByNationality}</h3>
          {nationalityRows.length === 0 ? <p className="text-slate-400 text-sm">{t.noData}</p> : (
            <div className="space-y-3">
              {nationalityRows.map(([nat, count]) => (
                <div key={nat}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300 capitalize">{nat}</span>
                    <span className="font-bold text-slate-800 dark:text-white">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round((count / counts.all) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">{t.visitRequests}</h3>
          <div className="space-y-0">
            {[
              { label: t.totalVisitRequests,  value: visitCount,          icon: "📋" },
              { label: t.upcomingVisitsLabel,  value: upcomingVisitCount,  icon: "📅" },
              { label: t.pastVisits,           value: pastVisitCount,      icon: "✓" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/6 last:border-0">
                <span className="text-sm text-slate-600 dark:text-slate-300">{icon} {label}</span>
                <span className="font-bold text-slate-800 dark:text-white text-base">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">{t.photoConsent}</h3>
          <div className="space-y-0">
            {[
              { label: t.socialMediaGiven,    value: socialMediaGiven,    dot: "bg-emerald-500" },
              { label: t.socialMediaNotGiven, value: socialMediaNotGiven, dot: "bg-red-400" },
              { label: t.postersGiven,        value: postersGiven,        dot: "bg-emerald-500" },
              { label: t.postersNotGiven,     value: postersNotGiven,     dot: "bg-red-400" },
            ].map(({ label, value, dot }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/6 last:border-0">
                <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                  {label}
                </span>
                <span className="font-bold text-slate-800 dark:text-white text-base">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
