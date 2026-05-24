import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { TranscriptStudent, TranscriptCourse } from "@/lib/types";
import StudentInfoEditor from "./StudentInfoEditor";
import CourseEditor from "./CourseEditor";

export default async function TranscriptStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: studentData } = await supabase
    .from("transcript_students")
    .select("*")
    .eq("id", id)
    .single();

  if (!studentData) notFound();

  const student = studentData as TranscriptStudent;

  const { data: coursesData } = await supabase
    .from("transcript_courses")
    .select("*")
    .eq("student_id", id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  const courses = (coursesData ?? []) as TranscriptCourse[];

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin?section=transcript"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="text-slate-300 dark:text-white/20">/</span>
          <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">{student.name}</h1>
        </div>
        <Link
          href={`/admin/transcript/${id}/print`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 text-slate-700 dark:text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Transcript
        </Link>
      </div>

      {/* Student info */}
      <StudentInfoEditor student={student} />

      {/* Courses */}
      <div>
        <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3">Courses &amp; Grades</h2>
        <CourseEditor studentId={id} initialCourses={courses} />
      </div>
    </div>
  );
}
