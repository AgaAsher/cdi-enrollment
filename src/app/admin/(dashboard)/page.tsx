import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { Enrollment, EnrollmentStatus } from "@/lib/types";
import Link from "next/link";
import { Suspense } from "react";
import SearchInput from "./SearchInput";
import ArchiveGrid from "./ArchiveGrid";
import UsersManager from "./UsersManager";
import ClassCapacityChart from "./ClassCapacityChart";
import SchoolSection from "./SchoolSection";
import StudentsList from "./StudentsList";
import { CLASS_LIMIT, type ClassData } from "./classConfig";

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

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; status?: string; search?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const section = params.section ?? "dashboard";
  const session = await getSession();
  const p = session?.permissions ?? {};
  const canEdit = p.students_edit ?? false;
  const supabase = createAdminClient();

  // Active students — try with deleted_at filter, fall back if column doesn't exist
  let { data: activeData, error: activeErr } = await supabase
    .from("enrollments")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (activeErr) {
    const { data: fallback } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false });
    activeData = fallback;
  }

  // Deleted students only — used exclusively for Archive
  const { data: deletedData } = section === "archive" && !activeErr
    ? await supabase
        .from("enrollments")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
    : { data: [] as Enrollment[] };

  const list = (activeData ?? []) as Enrollment[];
  const deletedEnrollments = (deletedData ?? []) as Enrollment[];

  const counts = {
    all:      list.length,
    pending:  list.filter((e) => e.status === "pending").length,
    reviewed: list.filter((e) => e.status === "reviewed").length,
    accepted: list.filter((e) => e.status === "accepted").length,
    rejected: list.filter((e) => e.status === "rejected").length,
  };

  const activeStatus = params.status ?? "all";
  const statusFiltered = activeStatus === "all" ? list : list.filter((e) => e.status === activeStatus);
  const filtered = params.search
    ? statusFiltered.filter((e) => {
        const q = params.search!.toLowerCase();
        return (
          e.child_first_name.toLowerCase().includes(q) ||
          e.child_last_name.toLowerCase().includes(q) ||
          e.parent1_email.toLowerCase().includes(q)
        );
      })
    : statusFiltered;

  const visitRequests = list
    .filter((e) => e.visit_date)
    .sort((a, b) => (a.visit_date! > b.visit_date! ? 1 : -1));

  const gradeMap: Record<string, number> = {};
  const nationalityMap: Record<string, number> = {};
  for (const e of list) {
    gradeMap[e.applying_for_grade] = (gradeMap[e.applying_for_grade] ?? 0) + 1;
    nationalityMap[e.child_nationality] = (nationalityMap[e.child_nationality] ?? 0) + 1;
  }
  const gradeRows = Object.entries(gradeMap).sort((a, b) => b[1] - a[1]);
  const nationalityRows = Object.entries(nationalityMap).sort((a, b) => b[1] - a[1]);

  // ── DASHBOARD ──
  if (section === "dashboard") {
    const recent = list.slice(0, 5);
    const upcomingVisits = visitRequests.filter((e) => e.visit_date! >= new Date().toISOString().split("T")[0]).slice(0, 5);

    const FIXED_GRADES = [
      { key: "Toddler (18–30 months)",   label: "Toddler"   },
      { key: "Nursery (30–42 months)",   label: "Nursery"   },
      { key: "Reception (42–54 months)", label: "Reception" },
      { key: "Pre-KG (54–72 months)",    label: "Pre-KG"    },
    ];
    const acceptedByGrade: Record<string, number> = {};
    for (const e of list.filter((e) => e.status === "accepted")) {
      acceptedByGrade[e.applying_for_grade] = (acceptedByGrade[e.applying_for_grade] ?? 0) + 1;
    }
    const classData: ClassData[] = FIXED_GRADES.map(({ key, label }) => {
      const enrolled = acceptedByGrade[key] ?? 0;
      return { name: label, fullName: key, enrolled, available: Math.max(CLASS_LIMIT - enrolled, 0) };
    });

    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Dashboard</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["pending", "reviewed", "accepted", "rejected"] as EnrollmentStatus[]).map((s) => {
            const c = STATUS_STAT_COLORS[s];
            return (
              <Link key={s} href={`/admin?section=master&status=${s}`} className="glass-card p-4 hover:scale-[1.02] transition-transform">
                <p className={`text-3xl font-bold ${c.num}`}>{counts[s]}</p>
                <p className={`text-sm capitalize mt-0.5 ${c.text}`}>{s}</p>
              </Link>
            );
          })}
        </div>

        {/* Class capacity */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-white">Class Enrollment</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />Enrolled</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Almost full</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Full</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-200 dark:bg-white/15 inline-block" />Available</span>
            </div>
          </div>
          <ClassCapacityChart data={classData} />
          {/* Summary row */}
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/8">
            {classData.map(({ name, fullName, enrolled: rawEnrolled, available: rawAvailable }) => {
              const enrolled = isNaN(rawEnrolled) ? 0 : rawEnrolled;
              const available = isNaN(rawAvailable) ? CLASS_LIMIT : rawAvailable;
              const full = available <= 0;
              const almost = available <= 3 && available > 0;
              return (
                <div key={fullName} className="text-center">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{name}</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{enrolled}<span className="text-xs text-slate-400 dark:text-slate-500 font-normal"> / {CLASS_LIMIT}</span></p>
                  <p className={`text-xs font-medium mt-0.5 ${full ? "text-red-500" : almost ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {full ? "Full" : `${available} left`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-3">Recent Applications</h2>
            {recent.length === 0 ? (
              <p className="text-slate-400 text-sm">No applications yet.</p>
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
            <h2 className="font-semibold text-slate-800 dark:text-white mb-3">Upcoming Visits</h2>
            {upcomingVisits.length === 0 ? (
              <p className="text-slate-400 text-sm">No upcoming visits.</p>
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

  // ── MASTER DATA ──
  if (section === "master") {
    // Build the set of statuses this user can see
    const allowedStatuses = (["pending", "reviewed", "accepted", "rejected"] as const).filter(
      (s) => p[`students_${s}`]
    );

    // Resolve which status to display (fall back if user lacks access to requested status)
    let effectiveStatus = activeStatus;
    if (activeStatus === "all") {
      if (!p.students_all) effectiveStatus = allowedStatuses[0] ?? "accepted";
    } else if (!p[`students_${activeStatus}`]) {
      effectiveStatus = p.students_all ? "all" : (allowedStatuses[0] ?? "accepted");
    }

    // Build visible list based on effective status and allowed statuses
    const visibleList =
      effectiveStatus === "all"
        ? list.filter((e) => allowedStatuses.includes(e.status as typeof allowedStatuses[number]))
        : list.filter((e) => e.status === effectiveStatus);

    const visibleFiltered = params.search
      ? visibleList.filter((e) => {
          const q = params.search!.toLowerCase();
          return (
            e.child_first_name.toLowerCase().includes(q) ||
            e.child_last_name.toLowerCase().includes(q) ||
            e.parent1_email.toLowerCase().includes(q)
          );
        })
      : visibleList;

    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">
            Students — <span className="capitalize">{effectiveStatus}</span>
          </h1>
          <Suspense>
            <SearchInput section="master" status={effectiveStatus} />
          </Suspense>
        </div>

        <div className="glass-card overflow-hidden">
          <StudentsList enrollments={visibleFiltered} canEdit={canEdit} />
        </div>
      </div>
    );
  }

  // ── VISIT REQUESTS ──
  if (section === "visits") {
    return (
      <div>
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white mb-5">Visit Requests</h1>
        <div className="glass-card overflow-hidden">
          {visitRequests.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm">No visit requests yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/4 border-b border-slate-100 dark:border-white/6">
                  <tr>
                    <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Child</th>
                    <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Grade</th>
                    <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Parent</th>
                    <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Contact</th>
                    <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Visit Date</th>
                    <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Time</th>
                    <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/6">
                  {visitRequests.map((e) => {
                    const isPast = e.visit_date! < new Date().toISOString().split("T")[0];
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
                          {isPast && <span className="ml-2 text-xs text-slate-400">(past)</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.visit_time ?? "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/${e.id}`} className="text-blue-700 hover:text-blue-900 font-medium">View →</Link>
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

  // ── SCHOOL ──
  if (section === "school") {
    const tab = params.tab ?? "timetable";
    return <SchoolSection tab={tab} enrollments={list} />;
  }

  // ── USERS ──
  if (section === "users") {
    return <UsersManager />;
  }

  // ── ARCHIVE ──
  if (section === "archive") {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Archive</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Deleted student records — all data preserved</p>
          </div>
          <span className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold px-3 py-1 rounded-full">
            {deletedEnrollments.length} record{deletedEnrollments.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ArchiveGrid enrollments={deletedEnrollments} />
      </div>
    );
  }

  // ── REPORTS ──
  const reportStats: { key: EnrollmentStatus; label: string; color: string; bar: string; bg: string }[] = [
    { key: "pending",  label: "Pending",  color: "text-amber-500",  bar: "bg-amber-400",  bg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/20" },
    { key: "reviewed", label: "Reviewed", color: "text-blue-500",   bar: "bg-blue-500",   bg: "bg-blue-500/10 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/20" },
    { key: "accepted", label: "Accepted", color: "text-emerald-500",bar: "bg-emerald-500",bg: "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/20" },
    { key: "rejected", label: "Rejected", color: "text-red-500",    bar: "bg-red-500",    bg: "bg-red-500/10 dark:bg-red-500/15 border-red-200 dark:border-red-500/20" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Reports</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {reportStats.map(({ key, label, color, bar, bg }) => {
          const pct = counts.all > 0 ? Math.round((counts[key] / counts.all) * 100) : 0;
          return (
            <div key={key} className={`glass-card p-5 border ${bg}`}>
              <p className={`text-4xl font-bold ${color}`}>{counts[key]}</p>
              <p className={`text-sm font-medium mt-1 ${color}`}>{label}</p>
              <div className="mt-3 h-1.5 bg-black/8 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full ${bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{pct}% of total</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Applications by Grade */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Applications by Grade</h3>
          {gradeRows.length === 0 ? <p className="text-slate-400 text-sm">No data.</p> : (
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

        {/* Applications by Nationality */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Applications by Nationality</h3>
          {nationalityRows.length === 0 ? <p className="text-slate-400 text-sm">No data.</p> : (
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

        {/* Visit Requests */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Visit Requests</h3>
          <div className="space-y-0">
            {[
              { label: "Total visit requests", value: visitRequests.length, icon: "📋" },
              { label: "Upcoming visits", value: visitRequests.filter((e) => e.visit_date! >= new Date().toISOString().split("T")[0]).length, icon: "📅" },
              { label: "Past visits", value: visitRequests.filter((e) => e.visit_date! < new Date().toISOString().split("T")[0]).length, icon: "✓" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/6 last:border-0">
                <span className="text-sm text-slate-600 dark:text-slate-300">{icon} {label}</span>
                <span className="font-bold text-slate-800 dark:text-white text-base">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Consent */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Photo Consent</h3>
          <div className="space-y-0">
            {[
              { label: "Social media — given",      value: list.filter((e) => e.consent_social_media === "given").length,     dot: "bg-emerald-500" },
              { label: "Social media — not given",  value: list.filter((e) => e.consent_social_media === "not_given").length, dot: "bg-red-400" },
              { label: "Posters / ads — given",     value: list.filter((e) => e.consent_marketing === "given").length,        dot: "bg-emerald-500" },
              { label: "Posters / ads — not given", value: list.filter((e) => e.consent_marketing === "not_given").length,    dot: "bg-red-400" },
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
