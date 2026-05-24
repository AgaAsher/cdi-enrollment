"use client";

import { useState, useRef } from "react";
import type { TranscriptCourse } from "@/lib/types";
import { scoreToGpa, gpaToQualification, derivedFinal, calculateGpa } from "@/lib/transcript-gpa";

function gpaBadgeClass(gpa: number): string {
  if (gpa >= 3.5) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (gpa >= 2.5) return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
  if (gpa >= 1.5) return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
}

function gpaOverallBadgeClass(gpa: number | null): string {
  if (gpa === null) return "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50";
  return gpaBadgeClass(gpa);
}

/* ── Editable cell ── */
function EditableCell({
  value,
  onSave,
  placeholder = "—",
}: {
  value: number | null;
  onSave: (v: number | null) => Promise<void>;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value !== null ? String(value) : "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setInput(value !== null ? String(value) : "");
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  }

  async function commit() {
    setEditing(false);
    const trimmed = input.trim();
    const parsed = trimmed === "" ? null : parseFloat(trimmed);
    const newVal = (parsed !== null && !isNaN(parsed)) ? Math.min(100, Math.max(0, parsed)) : null;
    if (newVal !== value) {
      setSaving(true);
      await onSave(newVal);
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); } }}
        className="w-16 px-1 py-0.5 text-sm text-center bg-white dark:bg-white/10 border border-blue-400 dark:border-blue-500 rounded-md outline-none text-slate-800 dark:text-white"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Click to edit"
      className={`cursor-pointer px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-sm ${
        saving ? "opacity-50" : ""
      } ${value !== null ? "text-slate-800 dark:text-white font-medium" : "text-slate-400 dark:text-slate-500 italic"}`}
    >
      {value !== null ? value.toFixed(1) : placeholder}
    </span>
  );
}

/* ── Editable text cell ── */
function EditableTextCell({
  value,
  onSave,
  placeholder = "—",
  className = "",
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setInput(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  }

  async function commit() {
    setEditing(false);
    if (input.trim() !== value) {
      setSaving(true);
      await onSave(input.trim());
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        className={`px-2 py-0.5 text-sm bg-white dark:bg-white/10 border border-blue-400 dark:border-blue-500 rounded-md outline-none text-slate-800 dark:text-white ${className}`}
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Click to edit"
      className={`cursor-pointer px-1 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors text-sm ${
        saving ? "opacity-50" : ""
      } ${value ? "text-slate-800 dark:text-white font-medium" : "text-slate-400 dark:text-slate-500 italic"} ${className}`}
    >
      {value || placeholder}
    </span>
  );
}

/* ── Main CourseEditor ── */
export default function CourseEditor({
  studentId,
  initialCourses,
}: {
  studentId: string;
  initialCourses: TranscriptCourse[];
}) {
  const [courses, setCourses] = useState<TranscriptCourse[]>(initialCourses);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHours, setNewHours] = useState("1");
  const [addError, setAddError] = useState("");

  const gpa = calculateGpa(courses);

  async function updateCourse(id: string, patch: Partial<TranscriptCourse>) {
    const res = await fetch(`/api/admin/transcript/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const { course } = await res.json();
      setCourses((prev) => prev.map((c) => (c.id === id ? course : c)));
    }
  }

  async function deleteCourse(id: string) {
    if (!confirm("Delete this course?")) return;
    const res = await fetch(`/api/admin/transcript/courses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    }
  }

  async function addCourse() {
    if (!newName.trim()) { setAddError("Course name is required."); return; }
    const hours = parseFloat(newHours) || 1;
    setAddError("");
    const res = await fetch("/api/admin/transcript/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        name: newName.trim(),
        teaching_hours: hours,
        sort_order: courses.length,
      }),
    });
    if (res.ok) {
      const { course } = await res.json();
      setCourses((prev) => [...prev, course]);
      setNewName(""); setNewHours("1"); setAdding(false);
    } else {
      const d = await res.json();
      setAddError(d.error ?? "Failed to add course.");
    }
  }

  return (
    <div className="space-y-4">
      {/* GPA Banner */}
      <div className={`glass-card p-4 flex items-center justify-between ${gpa !== null ? "" : ""}`}>
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall GPA</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
            {gpa !== null ? gpa.toFixed(2) : "—"}
          </p>
        </div>
        {gpa !== null && (
          <span className={`px-4 py-2 rounded-xl text-sm font-bold ${gpaOverallBadgeClass(gpa)}`}>
            {gpaToQualification(gpa)}
          </span>
        )}
      </div>

      {/* Courses Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-white/8">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hrs/Wk</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Term 1</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Term 2</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Final</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GPA Pts</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Qualification</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/6">
            {courses.map((c) => {
              const grade = derivedFinal(c);
              const gpaPoints = grade !== null ? scoreToGpa(grade) : null;
              return (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-white/4 transition-colors group">
                  <td className="px-4 py-2">
                    <EditableTextCell
                      value={c.name}
                      onSave={(v) => updateCourse(c.id, { name: v })}
                      placeholder="Course name"
                      className="min-w-[120px]"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <EditableCell
                      value={c.teaching_hours}
                      onSave={(v) => updateCourse(c.id, { teaching_hours: v ?? 1 })}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <EditableCell
                      value={c.half_year_avg}
                      onSave={(v) => updateCourse(c.id, { half_year_avg: v })}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <EditableCell
                      value={c.final_avg}
                      onSave={(v) => updateCourse(c.id, { final_avg: v })}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-sm font-semibold ${grade !== null ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500 italic"}`}>
                      {grade !== null ? grade.toFixed(1) : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {gpaPoints !== null ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${gpaBadgeClass(gpaPoints)}`}>
                        {gpaPoints.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-left">
                    <span className={`text-xs ${gpaPoints !== null ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500 italic"}`}>
                      {gpaPoints !== null ? gpaToQualification(gpaPoints) : "—"}
                    </span>
                  </td>
                  <td className="px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => deleteCourse(c.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Delete course"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Add course row */}
            {adding ? (
              <tr className="bg-blue-50/40 dark:bg-blue-500/5">
                <td className="px-4 py-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Course name *"
                    onKeyDown={(e) => { if (e.key === "Enter") addCourse(); if (e.key === "Escape") setAdding(false); }}
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-white/10 border border-blue-400 dark:border-blue-500 rounded-md outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    autoFocus
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                    className="w-14 px-2 py-1 text-sm text-center bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-md outline-none text-slate-800 dark:text-white"
                  />
                </td>
                <td colSpan={5} className="px-3 py-2">
                  {addError && <span className="text-xs text-red-500">{addError}</span>}
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <button onClick={addCourse} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors" title="Save">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button onClick={() => { setAdding(false); setNewName(""); setNewHours("1"); setAddError(""); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-2">
                  <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Course
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">Click any cell to edit inline. Changes save automatically on blur.</p>
    </div>
  );
}
