"use client";

import { useState } from "react";

type Student = { id: string; first: string; last: string; grade: string };

const CLASSES = [
  "Toddler (18–30 months)",
  "Nursery (30–42 months)",
  "Reception (42–54 months)",
  "Pre-KG (54–72 months)",
];

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

export default function AttendanceView({ students }: { students: Student[] }) {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | null>>({});
  const [saved, setSaved] = useState(false);

  const classStudents = students.filter((s) => s.grade === selectedClass);

  function toggle(id: string) {
    setSaved(false);
    setAttendance((prev) => {
      const cur = prev[id];
      return { ...prev, [id]: cur === "present" ? "absent" : cur === "absent" ? null : "present" };
    });
  }

  function markAll(status: "present" | "absent") {
    setSaved(false);
    const next: Record<string, "present" | "absent"> = {};
    classStudents.forEach((s) => { next[s.id] = status; });
    setAttendance((prev) => ({ ...prev, ...next }));
  }

  const present = classStudents.filter((s) => attendance[s.id] === "present").length;
  const absent  = classStudents.filter((s) => attendance[s.id] === "absent").length;
  const unmarked = classStudents.length - present - absent;

  return (
    <div className="space-y-5">
      {/* Date + class selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Today</p>
          <p className="text-base font-semibold text-slate-800 dark:text-white mt-0.5">{TODAY}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CLASSES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedClass(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                selectedClass === c
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-400 hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              }`}
            >
              {c.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Present", value: present, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" },
          { label: "Absent",  value: absent,  color: "text-red-500 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20" },
          { label: "Unmarked",value: unmarked, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/8" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`glass-card p-4 text-center border ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className={`text-xs font-medium mt-0.5 ${color}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Student list */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/8">
          <p className="text-sm font-semibold text-slate-700 dark:text-white">
            {selectedClass} — {classStudents.length} student{classStudents.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => markAll("present")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
            >
              All Present
            </button>
            <button
              onClick={() => markAll("absent")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25 hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors"
            >
              All Absent
            </button>
          </div>
        </div>

        {classStudents.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">No accepted students in this class yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/6">
            {classStudents.map((s, i) => {
              const status = attendance[s.id] ?? null;
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                  <span className="text-xs text-slate-400 dark:text-slate-600 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      {s.first[0]}{s.last[0]}
                    </span>
                  </div>
                  <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {s.first} {s.last}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggle(s.id)}
                      className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
                        status === "present"
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                          : "border-slate-200 dark:border-white/15 text-slate-300 dark:text-white/20 hover:border-emerald-400 hover:text-emerald-500"
                      }`}
                      title="Present"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setAttendance((prev) => ({ ...prev, [s.id]: prev[s.id] === "absent" ? null : "absent" }))}
                      className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
                        status === "absent"
                          ? "bg-red-500 border-red-500 text-white shadow-sm shadow-red-500/25"
                          : "border-slate-200 dark:border-white/15 text-slate-300 dark:text-white/20 hover:border-red-400 hover:text-red-500"
                      }`}
                      title="Absent"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {classStudents.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-white/8 flex items-center justify-between">
            {saved ? (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                Attendance saved
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {unmarked > 0 ? `${unmarked} student${unmarked !== 1 ? "s" : ""} not yet marked` : "All students marked"}
              </span>
            )}
            <button
              onClick={() => setSaved(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-500/25"
            >
              Save Attendance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
