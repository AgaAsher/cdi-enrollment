"use client";

import Link from "next/link";
import { useAdminLang } from "@/components/AdminLangProvider";
import ClassCapacityChart from "./ClassCapacityChart";
import { CLASS_LIMIT, type ClassData } from "./classConfig";
import { type EnrollmentStatus } from "@/lib/types";
import { type AdminT } from "@/lib/i18n/admin";

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  pending:  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
  reviewed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
  rejected: "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
};

const STATUS_STAT_COLORS: Record<EnrollmentStatus, { bg: string; text: string; num: string }> = {
  pending:  { bg: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20",     text: "text-amber-700 dark:text-amber-400",   num: "text-amber-800 dark:text-amber-300"   },
  reviewed: { bg: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20",         text: "text-blue-600 dark:text-blue-400",     num: "text-blue-800 dark:text-blue-300"     },
  accepted: { bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", num: "text-emerald-800 dark:text-emerald-300" },
  rejected: { bg: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20",             text: "text-red-500 dark:text-red-400",       num: "text-red-800 dark:text-red-300"       },
};

const STATUS_DOT: Record<EnrollmentStatus, string> = {
  pending:  "bg-amber-400",
  reviewed: "bg-blue-400",
  accepted: "bg-emerald-400",
  rejected: "bg-red-400",
};

const STATUS_LABEL_KEY: Record<EnrollmentStatus, keyof AdminT> = {
  pending:  "statusPending",
  reviewed: "statusReviewed",
  accepted: "statusAccepted",
  rejected: "statusRejected",
};

type RecentItem = {
  id: string;
  child_first_name: string;
  child_last_name: string;
  applying_for_grade: string;
  created_at: string;
  status: EnrollmentStatus;
};

type VisitItem = {
  id: string;
  child_first_name: string;
  child_last_name: string;
  parent1_full_name: string;
  parent1_phone: string;
  visit_date: string | null;
  visit_time: string | null;
};

type Props = {
  counts: Record<string, number>;
  classData: ClassData[];
  recent: RecentItem[];
  upcomingVisits: VisitItem[];
};

export default function DashboardView({ counts, classData, recent, upcomingVisits }: Props) {
  const { t } = useAdminLang();

  function StatusBadge({ status }: { status: EnrollmentStatus }) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
        {t[STATUS_LABEL_KEY[status]]}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">{t.dashboard}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["pending", "reviewed", "accepted", "rejected"] as EnrollmentStatus[]).map((s) => {
          const c = STATUS_STAT_COLORS[s];
          return (
            <Link key={s} href={`/admin?section=master&status=${s}`} className="glass-card p-4 hover:scale-[1.02] transition-transform">
              <p className={`text-3xl font-bold ${c.num}`}>{counts[s]}</p>
              <p className={`text-sm mt-0.5 ${c.text}`}>{t[STATUS_LABEL_KEY[s]]}</p>
            </Link>
          );
        })}
      </div>

      {/* Class capacity */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 dark:text-white">{t.classEnrollment}</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />{t.enrolled}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />{t.almostFull}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />{t.full}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-white/15 inline-block" />{t.available}</span>
          </div>
        </div>
        <ClassCapacityChart data={classData} />
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/8">
          {classData.map(({ name, fullName, enrolled: rawEnrolled, available: rawAvailable }) => {
            const enrolled = isNaN(rawEnrolled) ? 0 : rawEnrolled;
            const available = isNaN(rawAvailable) ? CLASS_LIMIT : rawAvailable;
            const full = available <= 0;
            const almost = available <= 3 && available > 0;
            return (
              <div key={fullName} className="text-center">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{name}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                  {enrolled}<span className="text-xs text-slate-400 dark:text-slate-500 font-normal"> / {CLASS_LIMIT}</span>
                </p>
                <p className={`text-xs font-medium mt-0.5 ${full ? "text-red-500" : almost ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                  {full ? t.full : `${available} ${t.left}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-3">{t.recentApplications}</h2>
          {recent.length === 0 ? (
            <p className="text-slate-400 text-sm">{t.noApplications}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/6">
              {recent.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{e.child_first_name} {e.child_last_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{e.applying_for_grade} · {new Date(e.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-3">{t.upcomingVisits}</h2>
          {upcomingVisits.length === 0 ? (
            <p className="text-slate-400 text-sm">{t.noUpcomingVisits}</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/6">
              {upcomingVisits.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{e.child_first_name} {e.child_last_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{e.parent1_full_name} · {e.parent1_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{e.visit_date}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{e.visit_time ?? "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
