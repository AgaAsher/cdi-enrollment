import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { TranscriptStudent, TranscriptCourse } from "@/lib/types";
import { calculateGpa, gpaToQualification } from "@/lib/transcript-gpa";
import AddStudentForm from "./AddStudentForm";

function gpaBadgeClass(gpa: number | null): string {
  if (gpa === null) return "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50";
  if (gpa >= 3.5) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (gpa >= 2.5) return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
  if (gpa >= 1.5) return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
}

export default async function TranscriptSection() {
  const supabase = createAdminClient();

  const { data: studentsData } = await supabase
    .from("transcript_students")
    .select("*")
    .order("created_at", { ascending: false });

  const students = (studentsData ?? []) as TranscriptStudent[];

  // Fetch all courses for all students
  const { data: coursesData } = await supabase
    .from("transcript_courses")
    .select("*");

  const allCourses = (coursesData ?? []) as TranscriptCourse[];

  // Build a map student_id → GPA
  const gpaMap: Record<string, number | null> = {};
  for (const s of students) {
    const courses = allCourses.filter((c) => c.student_id === s.id);
    gpaMap[s.id] = calculateGpa(courses);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Transcript Management</h1>
      </div>

      {/* Add Student Form */}
      <AddStudentForm />

      {/* Students Table */}
      {students.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 dark:bg-white/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No students yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Add a student above to get started.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/8">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Year Group</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Academic Year</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GPA</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/6">
              {students.map((s) => {
                const gpa = gpaMap[s.id];
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-white/4 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.student_no || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.year_group || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.academic_year || "—"}</td>
                    <td className="px-4 py-3">
                      {gpa !== null ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${gpaBadgeClass(gpa)}`}>
                          {gpa.toFixed(2)} — {gpaToQualification(gpa)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">No grades</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/transcript/${s.id}`}
                          className="px-3 py-1.5 text-xs font-semibold bg-[#0f1f6b] hover:bg-[#1a30a0] text-white rounded-lg transition-colors"
                        >
                          View / Edit
                        </Link>
                        <Link
                          href={`/admin/transcript/${s.id}/print`}
                          target="_blank"
                          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white rounded-lg transition-colors"
                        >
                          Print
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
