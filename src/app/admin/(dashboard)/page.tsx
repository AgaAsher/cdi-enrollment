import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { Enrollment, EnrollmentStatus } from "@/lib/types";
import { Suspense } from "react";
import SearchInput from "./SearchInput";
import UsersManager from "./UsersManager";
import SchoolSection from "./SchoolSection";
import StudentsList from "./StudentsList";
import { CLASS_LIMIT, type ClassData } from "./classConfig";
import DashboardView from "./DashboardView";
import VisitsView from "./VisitsView";
import ReportsView from "./ReportsView";
import ArchiveView from "./ArchiveView";
import TranscriptSection from "./TranscriptSection";

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

  const { data: deletedData } = section === "archive" && !activeErr
    ? await supabase
        .from("enrollments")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
    : { data: [] as Enrollment[] };

  const list = (activeData ?? []) as Enrollment[];
  const deletedEnrollments = (deletedData ?? []) as Enrollment[];

  const deletedWithPhotos = section === "archive"
    ? await Promise.all(
        deletedEnrollments.map(async (e) => {
          const photoUrl = e.student_3x4_path
            ? (await supabase.storage.from("enrollment-docs").createSignedUrl(e.student_3x4_path, 3600)).data?.signedUrl ?? null
            : null;
          return { ...e, photoUrl };
        })
      )
    : [];

  const counts = {
    all:      list.length,
    pending:  list.filter((e) => e.status === "pending").length,
    reviewed: list.filter((e) => e.status === "reviewed").length,
    accepted: list.filter((e) => e.status === "accepted").length,
    rejected: list.filter((e) => e.status === "rejected").length,
  };

  const activeStatus = params.status ?? "all";
  const visitRequests = list
    .filter((e) => e.visit_date)
    .sort((a, b) => (a.visit_date! > b.visit_date! ? 1 : -1));

  // ── DASHBOARD ──
  if (section === "dashboard") {
    const recent = list.slice(0, 5);
    const today = new Date().toISOString().split("T")[0];
    const upcomingVisits = visitRequests.filter((e) => e.visit_date! >= today).slice(0, 5);

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

    return <DashboardView counts={counts} classData={classData} recent={recent} upcomingVisits={upcomingVisits} />;
  }

  // ── MASTER DATA ──
  if (section === "master") {
    const allowedStatuses = (["pending", "reviewed", "accepted", "rejected"] as const).filter(
      (s) => p[`students_${s}`]
    );

    let effectiveStatus = activeStatus;
    if (activeStatus === "all") {
      if (!p.students_all) effectiveStatus = allowedStatuses[0] ?? "accepted";
    } else if (!p[`students_${activeStatus}`]) {
      effectiveStatus = p.students_all ? "all" : (allowedStatuses[0] ?? "accepted");
    }

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
    return <VisitsView visitRequests={visitRequests as Parameters<typeof VisitsView>[0]["visitRequests"]} />;
  }

  // ── SCHOOL ──
  if (section === "school") {
    const tab = params.tab ?? "timetable";
    const canMenuEdit = !!(p.menu_edit || session?.role === "admin" || session?.role === "super_admin");
    return <SchoolSection tab={tab} enrollments={list} canMenuEdit={canMenuEdit} />;
  }

  // ── TRANSCRIPT ──
  if (section === "transcript") {
    return <TranscriptSection />;
  }

  // ── USERS ──
  if (section === "users") {
    return <UsersManager />;
  }

  // ── ARCHIVE ──
  if (section === "archive") {
    return <ArchiveView enrollments={deletedWithPhotos} />;
  }

  // ── REPORTS ──
  const gradeMap: Record<string, number> = {};
  const nationalityMap: Record<string, number> = {};
  for (const e of list) {
    gradeMap[e.applying_for_grade] = (gradeMap[e.applying_for_grade] ?? 0) + 1;
    nationalityMap[e.child_nationality] = (nationalityMap[e.child_nationality] ?? 0) + 1;
  }
  const gradeRows = Object.entries(gradeMap).sort((a, b) => b[1] - a[1]);
  const nationalityRows = Object.entries(nationalityMap).sort((a, b) => b[1] - a[1]);
  const today = new Date().toISOString().split("T")[0];

  return (
    <ReportsView
      counts={counts}
      gradeRows={gradeRows}
      nationalityRows={nationalityRows}
      visitCount={visitRequests.length}
      upcomingVisitCount={visitRequests.filter((e) => e.visit_date! >= today).length}
      pastVisitCount={visitRequests.filter((e) => e.visit_date! < today).length}
      socialMediaGiven={list.filter((e) => e.consent_social_media === "given").length}
      socialMediaNotGiven={list.filter((e) => e.consent_social_media === "not_given").length}
      postersGiven={list.filter((e) => e.consent_marketing === "given").length}
      postersNotGiven={list.filter((e) => e.consent_marketing === "not_given").length}
    />
  );
}
