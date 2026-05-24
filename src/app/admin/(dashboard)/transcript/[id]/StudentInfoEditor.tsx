"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TranscriptStudent } from "@/lib/types";

export default function StudentInfoEditor({ student }: { student: TranscriptStudent }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(student.name);
  const [studentNo, setStudentNo] = useState(student.student_no);
  const [yearGroup, setYearGroup] = useState(student.year_group);
  const [academicYear, setAcademicYear] = useState(student.academic_year);

  async function save() {
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/transcript/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), student_no: studentNo, year_group: yearGroup, academic_year: academicYear }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed to save."); }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${student.name} and all their courses? This cannot be undone.`)) return;
    await fetch(`/api/admin/transcript/students/${student.id}`, { method: "DELETE" });
    router.push("/admin?section=transcript");
  }

  if (!editing) {
    return (
      <div className="glass-card p-5 flex items-start justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-1">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Name</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{student.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Student No</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{student.student_no || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Year Group</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{student.year_group || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Academic Year</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{student.academic_year || "—"}</p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 rounded-lg transition-colors"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Student No</label>
          <input
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Year Group</label>
          <input
            value={yearGroup}
            onChange={(e) => setYearGroup(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Academic Year</label>
          <input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-[#0f1f6b] hover:bg-[#1a30a0] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
        <button
          onClick={() => { setEditing(false); setName(student.name); setStudentNo(student.student_no); setYearGroup(student.year_group); setAcademicYear(student.academic_year); setError(""); }}
          className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className="ml-auto px-4 py-2 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
        >
          Delete Student
        </button>
      </div>
    </div>
  );
}
