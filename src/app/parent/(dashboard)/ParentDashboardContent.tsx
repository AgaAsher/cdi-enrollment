"use client";

import { useParentLang } from "@/components/ParentLangProvider";
import CollapsibleSection from "./CollapsibleSection";
import ParentChildrenTabs from "./ParentChildrenTabs";
import ParentWeeklyMenu from "./ParentWeeklyMenu";
import { Enrollment } from "@/lib/types";

type FeedbackEntry = {
  id: string; enrollment_id: string; teacher_name: string;
  class_label: string; category: string; content: string; created_at: string;
};
type TimetableRow = { time: string; duration: string; color: string; cells: { subject: string; teacher: string; room: string; isFixed: boolean }[][] };
type ClassOut = { label: string; rows: TimetableRow[] };
type TimetableData = Record<string, ClassOut>;

const EVENT_COLORS: Record<string, string> = {
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  green:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  pink:   "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  amber:  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

const NOTICE_COLORS: Record<string, string> = {
  Admin:  "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-400",
  Event:  "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  Health: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export default function ParentDashboardContent({
  firstName,
  children,
  attendanceSummaries,
  allFeedback,
  timetableData,
  menuData,
  todayDayName,
  upcomingEvents,
  notices,
}: {
  firstName: string;
  children: Enrollment[];
  attendanceSummaries: { present: number; absent: number }[];
  allFeedback: FeedbackEntry[];
  timetableData: TimetableData | null;
  menuData: Record<string, Record<string, string>> | null;
  todayDayName: string | null;
  upcomingEvents: { date: string; title: string; type: string; color: string }[];
  notices: { date: string; title: string; category: string; body: string }[];
}) {
  const { t } = useParentLang();

  const childSectionTitle = children.length === 1
    ? `${children[0]?.child_first_name ?? ""} ${children[0]?.child_last_name ?? ""}`.trim()
    : t.myChildren;

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#0f1f6b] dark:text-white">
          {t.welcome}, {firstName}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {children.length !== 1 ? t.overviewPlural : t.overview}
        </p>
      </div>

      {/* Children tabs */}
      <CollapsibleSection title={childSectionTitle}>
        <ParentChildrenTabs
          children={children}
          attendanceSummaries={attendanceSummaries}
          allFeedback={allFeedback}
          timetableData={timetableData}
        />
      </CollapsibleSection>

      {/* Weekly Menu */}
      <CollapsibleSection title={t.weeklyMenu}>
        <ParentWeeklyMenu menuData={menuData} todayDayName={todayDayName} />
      </CollapsibleSection>

      {/* Upcoming Events */}
      <CollapsibleSection title={t.upcomingEvents}>
        <div className="divide-y divide-slate-100 dark:divide-white/8">
          {upcomingEvents.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">{t.noEvents}</div>
          ) : (
            upcomingEvents.map((ev, i) => {
              const d = new Date(ev.date + "T00:00");
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="text-center shrink-0 w-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{d.toLocaleDateString("en", { month: "short" })}</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white leading-none">{d.getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{ev.title}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${EVENT_COLORS[ev.color] ?? EVENT_COLORS.blue}`}>
                    {ev.type}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CollapsibleSection>

      {/* Noticeboard */}
      <CollapsibleSection title={t.noticeboard}>
        <div className="divide-y divide-slate-100 dark:divide-white/8">
          {notices.map((n, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{n.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${NOTICE_COLORS[n.category] ?? NOTICE_COLORS.Admin}`}>
                    {n.category}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.date}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{n.body}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
