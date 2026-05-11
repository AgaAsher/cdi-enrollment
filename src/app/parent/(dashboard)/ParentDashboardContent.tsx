"use client";

import { useState } from "react";
import { useParentLang } from "@/components/ParentLangProvider";
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
  blue:   "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  green:  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  pink:   "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  amber:  "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
};

const NOTICE_COLORS: Record<string, string> = {
  Admin:  "bg-slate-100 text-slate-500 dark:bg-white/8 dark:text-slate-400",
  Event:  "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  Health: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
};

function gradeShort(gradeKey: string): string {
  if (gradeKey.startsWith("Toddler"))   return "Toddler";
  if (gradeKey.startsWith("Nursery"))   return "Nursery";
  if (gradeKey.startsWith("Reception")) return "Reception";
  if (gradeKey.startsWith("Pre-KG"))    return "Pre-KG";
  return gradeKey;
}

type Tab = "child" | "menu" | "events" | "noticeboard";

const TABS: { key: Tab; icon: React.ReactNode }[] = [
  {
    key: "child",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: "menu",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: "events",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: "noticeboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

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
  const [tab, setTab] = useState<Tab>("child");
  const [activeChildIdx, setActiveChildIdx] = useState(0);

  const tabLabels: Record<Tab, string> = {
    child:       children.length === 1
                   ? `${children[0]?.child_first_name ?? ""} ${children[0]?.child_last_name ?? ""}`.trim()
                   : t.myChildren,
    menu:        t.weeklyMenu,
    events:      t.upcomingEvents,
    noticeboard: t.noticeboard,
  };

  /* ── Hero active child info ───────────────────────────────────────────── */
  const activeChild = children[activeChildIdx];
  const activeInitials = activeChild
    ? (activeChild.child_first_name?.[0] ?? "").toUpperCase() + (activeChild.child_last_name?.[0] ?? "").toUpperCase()
    : "?";

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col relative"
      style={{
        background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(26,63,168,0.28) 0%, transparent 65%)",
      }}>

      {/* ── Hero card ───────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-8 pb-5 max-w-2xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1e47c0 0%, #0f1f6b 55%, #160d55 100%)",
            boxShadow: "0 20px 60px rgba(15,31,107,0.45), 0 4px 16px rgba(0,0,0,0.2)",
          }}>

          {/* Decorative blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(99,179,237,0.22) 0%, transparent 70%)" }} />
            <div className="absolute -bottom-14 -left-10 w-48 h-48 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-24 opacity-20"
              style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 70%)" }} />
          </div>

          <div className="relative px-6 pt-7 pb-6">
            {/* Greeting row */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/25"
                style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(8px)" }}>
                <span className="text-2xl font-bold text-white tracking-tight">{activeInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/55 text-[11px] font-semibold tracking-widest uppercase mb-1">{t.welcome}</p>
                <h1 className="text-3xl font-bold text-white tracking-tight leading-none">{firstName}</h1>
                <p className="text-white/45 text-xs mt-1.5 font-medium">Parent Portal · CDA</p>
              </div>
            </div>
          </div>

          {/* Tab bar — embedded in card */}
          <div className="relative flex border-t border-white/10"
            style={{ background: "rgba(0,0,0,0.15)" }}>
            {TABS.map(({ key, icon }) => {
              const isActive = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? "text-white bg-white/10"
                      : "text-white/35 hover:text-white/65 hover:bg-white/5"
                  }`}
                >
                  <span className={`transition-transform ${isActive ? "scale-110" : ""}`}>{icon}</span>
                  <span className="hidden sm:block truncate px-1">{tabLabels[key].split(" ")[0]}</span>
                  {isActive && <span className="w-4 h-0.5 rounded-full bg-white/70" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 sm:px-6 pb-12 max-w-2xl mx-auto w-full">

        {tab === "child" && (
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#141c2e] border border-slate-100 dark:border-white/8 shadow-xl shadow-black/10 dark:shadow-black/30">
            <ParentChildrenTabs
              children={children}
              attendanceSummaries={attendanceSummaries}
              allFeedback={allFeedback}
              timetableData={timetableData}
              activeIdx={activeChildIdx}
              setActiveIdx={setActiveChildIdx}
            />
          </div>
        )}

        {tab === "menu" && (
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#141c2e] border border-slate-100 dark:border-white/8 shadow-xl shadow-black/10 dark:shadow-black/30">
            <div className="px-6 pt-6 pb-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #1a3fa8, #0f1f6b)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">{t.weeklyMenu}</h2>
            </div>
            <ParentWeeklyMenu menuData={menuData} todayDayName={todayDayName} />
          </div>
        )}

        {tab === "events" && (
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#141c2e] border border-slate-100 dark:border-white/8 shadow-xl shadow-black/10 dark:shadow-black/30">
            <div className="px-6 pt-6 pb-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #1a3fa8, #0f1f6b)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">{t.upcomingEvents}</h2>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400 dark:text-slate-500">{t.noEvents}</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/6 px-4 pb-4">
                {upcomingEvents.map((ev, i) => {
                  const d = new Date(ev.date + "T00:00");
                  return (
                    <div key={i} className="flex items-center gap-4 py-3.5">
                      <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, #1a3fa8 0%, #0f1f6b 100%)" }}>
                        <p className="text-[9px] font-bold text-blue-200 uppercase leading-none">
                          {d.toLocaleDateString("en", { month: "short" })}
                        </p>
                        <p className="text-lg font-bold text-white leading-none">{d.getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{ev.title}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${EVENT_COLORS[ev.color] ?? EVENT_COLORS.blue}`}>
                        {ev.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "noticeboard" && (
          <div className="rounded-3xl overflow-hidden bg-white dark:bg-[#141c2e] border border-slate-100 dark:border-white/8 shadow-xl shadow-black/10 dark:shadow-black/30">
            <div className="px-6 pt-6 pb-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #1a3fa8, #0f1f6b)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">{t.noticeboard}</h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/6 px-4 pb-4">
              {notices.map((n, i) => (
                <div key={i} className="py-4">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">{n.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${NOTICE_COLORS[n.category] ?? NOTICE_COLORS.Admin}`}>
                      {n.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{n.body}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">{n.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
