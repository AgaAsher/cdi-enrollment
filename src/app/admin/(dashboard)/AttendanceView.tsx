"use client";

import { useState, useEffect, useCallback } from "react";

type Student = { id: string; first: string; last: string; grade: string };
type AttStatus = "present" | "absent" | null;

const CLASSES = [
  "Toddler (18–30 months)",
  "Nursery (30–42 months)",
  "Reception (42–54 months)",
  "Pre-KG (54–72 months)",
];

function toIso(d: Date) {
  return d.toISOString().split("T")[0];
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function offsetDate(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export default function AttendanceView({ students }: { students: Student[] }) {
  const todayIso = toIso(new Date());
  const [date, setDate] = useState(todayIso);
  const [selectedClass, setSelectedClass] = useState(CLASSES[1]); // Nursery default
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Export panel state
  const [showExport, setShowExport] = useState(false);
  const [exportFrom, setExportFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toIso(d);
  });
  const [exportTo, setExportTo] = useState(todayIso);
  const [exporting, setExporting] = useState(false);

  const classStudents = students.filter((s) => s.grade === selectedClass);

  const loadAttendance = useCallback(async (d: string, cls: string) => {
    setLoading(true);
    setSaved(false);
    setSavedAt(null);
    setAttendance({});
    try {
      const res = await fetch(`/api/admin/attendance?date=${d}&class=${encodeURIComponent(cls)}`);
      const json = await res.json();
      if (json.records && Array.isArray(json.records)) {
        const map: Record<string, AttStatus> = {};
        for (const r of json.records) {
          map[r.student_id] = r.status === "present" ? "present" : r.status === "absent" ? "absent" : null;
        }
        setAttendance(map);
        if (json.updatedAt) {
          setSavedAt(new Date(json.updatedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }));
          setSaved(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance(date, selectedClass);
  }, [date, selectedClass, loadAttendance]);

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

  async function save() {
    setSaving(true);
    const records = classStudents.map((s) => ({
      student_id: s.id,
      student_name: `${s.first} ${s.last}`,
      status: attendance[s.id] ?? "unmarked",
    }));
    const res = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, class_label: selectedClass, records }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setSavedAt(new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }));
    }
  }

  async function downloadExcel() {
    setExporting(true);
    const url = `/api/admin/attendance/export?from=${exportFrom}&to=${exportTo}`;
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `attendance_${exportFrom}_to_${exportTo}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    setExporting(false);
  }

  const present  = classStudents.filter((s) => attendance[s.id] === "present").length;
  const absent   = classStudents.filter((s) => attendance[s.id] === "absent").length;
  const unmarked = classStudents.length - present - absent;
  const isToday  = date === todayIso;

  return (
    <div className="space-y-5">
      {/* Date nav + class selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate((d) => offsetDate(d, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {isToday ? "Today" : "Past date"}
            </p>
            <input
              type="date"
              value={date}
              max={todayIso}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="text-sm font-semibold text-slate-800 dark:text-white bg-transparent border-none outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => setDate((d) => { const next = offsetDate(d, 1); return next <= todayIso ? next : d; })}
            disabled={date >= todayIso}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/12 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
          {!isToday && (
            <button
              onClick={() => setDate(todayIso)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Today
            </button>
          )}
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

      {/* Date full label */}
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{fmtDate(date)}</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Present",  value: present,  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" },
          { label: "Absent",   value: absent,   color: "text-red-500 dark:text-red-400",          bg: "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20" },
          { label: "Unmarked", value: unmarked, color: "text-slate-500 dark:text-slate-400",       bg: "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/8" },
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

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : classStudents.length === 0 ? (
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
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{s.first[0]}{s.last[0]}</span>
                  </div>
                  <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{s.first} {s.last}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAttendance((p) => ({ ...p, [s.id]: p[s.id] === "present" ? null : "present" }))}
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
                      onClick={() => setAttendance((p) => ({ ...p, [s.id]: p[s.id] === "absent" ? null : "absent" }))}
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
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {saved
                ? `✓ Saved at ${savedAt}`
                : unmarked > 0
                ? `${unmarked} student${unmarked !== 1 ? "s" : ""} not yet marked`
                : "All students marked"}
            </span>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-500/25"
            >
              {saving ? "Saving…" : "Save Attendance"}
            </button>
          </div>
        )}
      </div>

      {/* Export / Download section */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Download Attendance Report</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Export attendance data for a date range as an Excel file</p>
          </div>
          <button
            onClick={() => setShowExport((v) => !v)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {showExport ? "Hide" : "Set dates →"}
          </button>
        </div>

        {showExport && (
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">From</label>
              <input
                type="date"
                value={exportFrom}
                max={exportTo}
                onChange={(e) => setExportFrom(e.target.value)}
                className="border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 text-slate-800 dark:text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">To</label>
              <input
                type="date"
                value={exportTo}
                min={exportFrom}
                max={todayIso}
                onChange={(e) => setExportTo(e.target.value)}
                className="border border-slate-200 dark:border-white/12 bg-white dark:bg-white/5 text-slate-800 dark:text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={downloadExcel}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              {exporting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Excel
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
