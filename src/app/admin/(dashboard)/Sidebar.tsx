"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAdminLang } from "@/components/AdminLangProvider";

type NavLeaf     = { label: string; href: string; badge?: number };
type NavSubGroup = { type: "subgroup"; label: string; key: string; icon?: React.ReactNode; children: NavLeaf[] };
type NavGroupChild = NavLeaf | NavSubGroup;

type NavItem =
  | { type: "link";  label: string; icon: React.ReactNode; href: string; badge?: number }
  | { type: "group"; label: string; icon: React.ReactNode; key: string; children: NavGroupChild[] };

const ADMISSION_SECTIONS = new Set(["master", "visits", "archive", "reports"]);

export default function Sidebar({
  counts,
  visitCount,
  permissions,
}: {
  counts: Record<string, number>;
  visitCount: number;
  permissions: Record<string, boolean>;
}) {
  const sp = useSearchParams();
  const section = sp.get("section") ?? "dashboard";
  const status  = sp.get("status") ?? "all";
  const tab     = sp.get("tab") ?? "";
  const { t } = useAdminLang();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    admission: false,
    students: false,
    school: false,
  });

  useEffect(() => {
    if (ADMISSION_SECTIONS.has(section)) setOpenGroups((p) => ({ ...p, admission: true }));
    if (section === "master")            setOpenGroups((p) => ({ ...p, students: true }));
    if (section === "school")            setOpenGroups((p) => ({ ...p, school: true }));
  }, [section]);

  function toggleGroup(key: string) {
    setOpenGroups((p) => ({ ...p, [key]: !p[key] }));
  }

  // ── icons ──────────────────────────────────────────────────────────────────
  const studentsIcon = (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  // ── students children ──────────────────────────────────────────────────────
  const studentsChildren: NavLeaf[] = [
    permissions.students_all      && { label: t.all,      href: "/admin?section=master&status=all",      badge: counts.all },
    permissions.students_pending  && { label: t.pending,  href: "/admin?section=master&status=pending",  badge: counts.pending },
    permissions.students_reviewed && { label: t.reviewed, href: "/admin?section=master&status=reviewed", badge: counts.reviewed },
    permissions.students_accepted && { label: t.accepted, href: "/admin?section=master&status=accepted", badge: counts.accepted },
    permissions.students_rejected && { label: t.rejected, href: "/admin?section=master&status=rejected", badge: counts.rejected },
  ].filter(Boolean) as NavLeaf[];

  // ── admission group children ───────────────────────────────────────────────
  const admissionChildren: NavGroupChild[] = [
    ...(permissions.students_view
      ? studentsChildren.length > 1
        ? [{ type: "subgroup" as const, label: t.applicants, key: "students", icon: studentsIcon, children: studentsChildren }]
        : studentsChildren.length === 1
          ? [studentsChildren[0]]
          : []
      : []
    ),
    ...(permissions.visits  ? [{ label: t.visitRequests, href: "/admin?section=visits",  badge: visitCount }] : []),
    ...(permissions.archive ? [{ label: t.archive,       href: "/admin?section=archive"               }] : []),
    ...(permissions.reports ? [{ label: t.reports,       href: "/admin?section=reports"               }] : []),
  ];

  // ── nav items ──────────────────────────────────────────────────────────────
  const items: NavItem[] = [
    ...(permissions.dashboard ? [{
      type: "link" as const,
      label: t.dashboard,
      href: "/admin?section=dashboard",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    }] : []),

    ...(admissionChildren.length > 0 ? [{
      type: "group" as const,
      label: t.admission,
      key: "admission",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      children: admissionChildren,
    }] : []),

    [{
      type: "group" as const,
      label: t.school,
      key: "school",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      children: [
        { label: t.teachers,    href: "/admin?section=school&tab=teachers" },
        { label: t.students,    href: "/admin?section=school&tab=students" },
        { label: t.parents,     href: "/admin?section=school&tab=parents" },
        { label: t.classes,     href: "/admin?section=school&tab=classes" },
        { label: t.timetable,   href: "/admin?section=school&tab=timetable" },
        { label: t.attendance,  href: "/admin?section=school&tab=attendance" },
        { label: t.weeklyMenu,  href: "/admin?section=school&tab=menu" },
        { label: t.events,      href: "/admin?section=school&tab=events" },
        { label: t.noticeboard, href: "/admin?section=school&tab=noticeboard" },
      ] as NavLeaf[],
    }][0],

    ...(permissions.users ? [{
      type: "link" as const,
      label: t.users,
      href: "/admin?section=users",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    }] : []),

    ...(permissions.settings ? [{
      type: "link" as const,
      label: t.settings,
      href: "/admin/settings",
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    }] : []),
  ];

  // ── group-level alert dots (shown when group is collapsed + has pending items)
  const groupDots: Record<string, boolean> = {
    admission: counts.pending > 0 || visitCount > 0,
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  function isLeafActive(href: string) {
    if (!href.includes("?")) {
      // Full path link (e.g. /admin/settings)
      return typeof window !== "undefined" && window.location.pathname === href;
    }
    const sec  = href.split("section=")[1]?.split("&")[0];
    const st   = href.split("status=")[1]?.split("&")[0];
    const tb   = href.split("tab=")[1]?.split("&")[0];
    if (sec !== section) return false;
    if (st  !== undefined && st  !== status) return false;
    if (tb  !== undefined && tb  !== tab)    return false;
    return true;
  }

  function isGroupActiveCheck(key: string) {
    if (key === "admission") return ADMISSION_SECTIONS.has(section);
    if (key === "school")    return section === "school";
    if (key === "master")    return section === "master";
    return false;
  }

  // ── render leaf ────────────────────────────────────────────────────────────
  function renderLeaf(child: NavLeaf, depth = 0) {
    const active = isLeafActive(child.href);
    return (
      <Link
        key={child.href}
        href={child.href}
        className={`flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-150 ${
          active
            ? "glass-tab-active-sub text-[#0f1f6b] font-semibold dark:text-white"
            : "text-[#0f1f6b]/70 hover:text-[#0f1f6b] hover:bg-white/80 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/8"
        } ${depth > 0 ? "ml-3" : ""}`}
      >
        <span>{child.label}</span>
        {child.badge != null && (
          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
            active ? "bg-[#0f1f6b] text-white dark:bg-blue-500" : "bg-[#0f1f6b]/10 text-[#0f1f6b]/60 dark:bg-white/10 dark:text-white/50"
          }`}>
            {child.badge}
          </span>
        )}
      </Link>
    );
  }

  // ── render subgroup ────────────────────────────────────────────────────────
  function renderSubGroup(sub: NavSubGroup) {
    const isActive = isGroupActiveCheck(sub.key);
    const isOpen   = openGroups[sub.key] ?? false;
    return (
      <div key={sub.key} className="flex flex-col gap-0.5">
        <button
          onClick={() => toggleGroup(sub.key)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-150 ${
            isActive
              ? "glass-tab-active-sub text-[#0f1f6b] font-semibold dark:text-white"
              : "text-[#0f1f6b]/70 hover:text-[#0f1f6b] hover:bg-white/80 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/8"
          }`}
        >
          {sub.icon && (
            <span className={`shrink-0 ${isActive ? "text-[#1a3fa8] dark:text-blue-400" : "text-[#0f1f6b]/50 dark:text-white/30"}`}>
              {sub.icon}
            </span>
          )}
          <span className="flex-1 text-left">{sub.label}</span>
          <svg
            className={`w-3 h-3 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""} ${isActive ? "text-[#1a3fa8] dark:text-blue-400" : "text-[#0f1f6b]/30 dark:text-white/30"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="ml-[22px] flex flex-col gap-0.5 border-l border-[#0f1f6b]/10 dark:border-white/10 pl-3 pb-1">
            {sub.children.map((leaf) => renderLeaf(leaf))}
          </div>
        )}
      </div>
    );
  }

  // ── render group ───────────────────────────────────────────────────────────
  function renderGroup(item: NavItem & { type: "group" }) {
    const isActive = isGroupActiveCheck(item.key);
    const isOpen   = openGroups[item.key] ?? false;
    const hasDot   = !isOpen && (groupDots[item.key] ?? false);

    return (
      <div key={item.key} className="flex flex-col gap-0.5">
        <button
          onClick={() => toggleGroup(item.key)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 ${
            isActive && isOpen
              ? "glass-tab-active text-[#0f1f6b] dark:text-white opacity-80"
              : isActive
              ? "glass-tab-active text-[#0f1f6b] dark:text-white"
              : "text-[#0f1f6b]/80 hover:bg-white/80 hover:text-[#0f1f6b] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
          }`}
        >
          <span className={`shrink-0 ${isActive ? "text-[#1a3fa8] dark:text-blue-400" : "text-[#0f1f6b]/60 dark:text-white/40"}`}>
            {item.icon}
          </span>
          <span className="flex-1 text-left">{item.label}</span>
          {hasDot && (
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
          )}
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isActive ? "text-[#1a3fa8] dark:text-blue-400" : "text-[#0f1f6b]/30 dark:text-white/30"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="ml-[22px] flex flex-col gap-0.5 border-l border-[#0f1f6b]/10 dark:border-white/10 pl-3 pb-1">
            {item.children.map((child) =>
              "type" in child && child.type === "subgroup"
                ? renderSubGroup(child)
                : renderLeaf(child as NavLeaf)
            )}
          </div>
        )}
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        if (item.type === "link") {
          const isActive = isLeafActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 ${
                isActive
                  ? "glass-tab-active text-[#0f1f6b] dark:text-white"
                  : "text-[#0f1f6b]/80 hover:bg-white/80 hover:text-[#0f1f6b] dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <span className={`shrink-0 ${isActive ? "text-[#1a3fa8] dark:text-blue-400" : "text-[#0f1f6b]/60 dark:text-white/40"}`}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center ${
                  isActive ? "bg-[#0f1f6b] text-white dark:bg-blue-500" : "bg-[#0f1f6b]/10 text-[#0f1f6b]/70 dark:bg-white/10 dark:text-white/60"
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        }
        return renderGroup(item);
      })}
    </nav>
  );
}
