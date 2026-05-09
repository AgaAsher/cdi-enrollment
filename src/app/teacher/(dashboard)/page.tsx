"use client";

import { useState, useEffect, useCallback } from "react";

type TeacherLesson = {
  classLabel: string;
  classKey: string;
  subject: string;
  time: string;
  duration: string;
  color: string;
  dayIndex: number;
  room: string;
  groupLabel: string;
};

type TeacherRow = {
  time: string;
  duration: string;
  cells: Array<TeacherLesson | null>;
};

type AttendanceStudent = {
  student_id: string;
  student_name: string;
  status: "present" | "absent" | "late";
};

type ModalState = {
  lesson: TeacherLesson;
  date: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const BG: Record<string, string> = {
  blue:   "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30",
  indigo: "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30",
  amber:  "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
  green:  "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30",
  purple: "bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30",
  orange: "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30",
  pink:   "bg-pink-50 border-pink-200 dark:bg-pink-500/10 dark:border-pink-500/30",
  violet: "bg-violet-50 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/30",
  slate:  "bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/10",
};
const TX: Record<string, string> = {
  blue:   "text-blue-800 dark:text-blue-300",
  indigo: "text-indigo-800 dark:text-indigo-300",
  amber:  "text-amber-800 dark:text-amber-300",
  green:  "text-emerald-800 dark:text-emerald-300",
  purple: "text-purple-800 dark:text-purple-300",
  orange: "text-orange-800 dark:text-orange-300",
  pink:   "text-pink-800 dark:text-pink-300",
  violet: "text-violet-800 dark:text-violet-300",
  slate:  "text-slate-500 dark:text-slate-400",
};

function getTodayIndex(): number {
  const d = new Date().getDay();
  return d >= 1 && d <= 5 ? d - 1 : 0;
}

function getDateForDayIndex(dayIndex: number): string {
  const today = new Date();
  const dow = today.getDay();
  const daysToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  monday.setDate(monday.getDate() + dayIndex);
  return monday.toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en", {
    weekday: "long", day: "numeric", month: "long",
  });
}

const STATUS_CONFIG = {
  present: { label: "Present", bg: "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300", dot: "bg-emerald-500" },
  late:    { label: "Late",    bg: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300",             dot: "bg-amber-400"  },
  absent:  { label: "Absent",  bg: "bg-red-100 border-red-300 text-red-700 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-300",                         dot: "bg-red-500"    },
} as const;

export default function TeacherPage() {
  const [teacherName, setTeacherName] = useState("");
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());

  // Attendance modal
  const [modal, setModal] = useState<ModalState | null>(null);
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/teacher/timetable")
      .then(r => r.json())
      .then(d => { setTeacherName(d.teacherName ?? ""); setRows(d.rows ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const loadAttendance = useCallback(async (lesson: TeacherLesson, date: string) => {
    setModalLoading(true);

    const [studentsRes, attendanceRes] = await Promise.all([
      fetch(`/api/teacher/students?class=${encodeURIComponent(lesson.classLabel)}`),
      fetch(`/api/teacher/attendance?date=${date}&class=${encodeURIComponent(lesson.classLabel)}&subject=${encodeURIComponent(lesson.subject)}&time=${encodeURIComponent(lesson.time)}`),
    ]);

    const { students: list = [] } = await studentsRes.json();
    const { records } = await attendanceRes.json();

    const base: AttendanceStudent[] = (list as { id: string; name: string }[]).map(s => ({
      student_id: s.id,
      student_name: s.name,
      status: "present" as const,
    }));

    if (records && Array.isArray(records)) {
      const statusMap = new Map<string, AttendanceStudent["status"]>(
        records.map((r: AttendanceStudent) => [r.student_id, r.status])
      );
      setStudents(base.map(s => ({ ...s, status: statusMap.get(s.student_id) ?? "present" })));
      // Mark as saved if records exist
      const key = `${date}-${lesson.classLabel}-${lesson.subject}-${lesson.time}`;
      setSavedKeys(prev => new Set([...prev, key]));
    } else {
      setStudents(base);
    }

    setModalLoading(false);
  }, []);

  function openModal(lesson: TeacherLesson) {
    const date = getDateForDayIndex(lesson.dayIndex);
    setModal({ lesson, date });
    loadAttendance(lesson, date);
  }

  async function handleDateChange(newDate: string) {
    if (!modal) return;
    setModal(m => m ? { ...m, date: newDate } : null);
    await loadAttendance(modal.lesson, newDate);
  }

  function setStatus(id: string, status: AttendanceStudent["status"]) {
    setStudents(prev => prev.map(s => s.student_id === id ? { ...s, status } : s));
  }

  function markAll(status: AttendanceStudent["status"]) {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  }

  async function saveAttendance() {
    if (!modal || students.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/teacher/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: modal.date,
        class_label: modal.lesson.classLabel,
        subject: modal.lesson.subject,
        slot_time: modal.lesson.time,
        records: students,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const key = `${modal.date}-${modal.lesson.classLabel}-${modal.lesson.subject}-${modal.lesson.time}`;
      setSavedKeys(prev => new Set([...prev, key]));
      setModal(null);
    }
  }

  const todayIndex = getTodayIndex();
  const todayLessons = rows
    .map(r => r.cells[selectedDay])
    .filter((l): l is TeacherLesson => l !== null);

  const totalLessons = rows.reduce(
    (sum, r) => sum + r.cells.filter(c => c !== null).length, 0
  );

  return (
    <div className="space-y-6">

      {/* Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">
            {teacherName ? `Welcome, ${teacherName.split(" ")[0]}` : "Teacher Dashboard"}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {!loading && (
          <div className="flex gap-3">
            <div className="bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-lg font-bold text-[#0f1f6b] dark:text-white">{totalLessons}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">lessons/week</p>
            </div>
            <div className="bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-lg font-bold text-[#0f1f6b] dark:text-white">{todayLessons.length}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {selectedDay === todayIndex ? "today" : DAY_SHORT[selectedDay]}
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#0f1f6b] dark:border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No timetable found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Your name has not been assigned to any lessons in the current timetable.<br />
            Please contact the admin.
          </p>
        </div>
      ) : (
        <>
          {/* Day tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-2xl p-1.5 w-fit">
            {DAY_SHORT.map((d, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors relative ${
                  selectedDay === i
                    ? "bg-[#0f1f6b] dark:bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0f1f6b] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                {d}
                {i === todayIndex && (
                  <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                    selectedDay === i ? "bg-blue-300" : "bg-blue-500"
                  }`} />
                )}
              </button>
            ))}
          </div>

          {/* Day label */}
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-700 dark:text-white">{DAYS[selectedDay]}</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(getDateForDayIndex(selectedDay))}</span>
            {selectedDay === todayIndex && (
              <span className="text-[11px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">Today</span>
            )}
          </div>

          {/* Lesson cards for selected day */}
          {todayLessons.length === 0 ? (
            <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 p-10 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">No lessons on {DAYS[selectedDay]}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayLessons.map((lesson, i) => {
                const key = `${getDateForDayIndex(lesson.dayIndex)}-${lesson.classLabel}-${lesson.subject}-${lesson.time}`;
                const done = savedKeys.has(key);
                return (
                  <button
                    key={i}
                    onClick={() => openModal(lesson)}
                    className={`text-left rounded-2xl border-2 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 group ${BG[lesson.color] ?? BG.slate}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                          {lesson.time}{lesson.duration ? ` · ${lesson.duration}` : ""}
                        </p>
                        <p className={`text-base font-bold mt-0.5 ${TX[lesson.color] ?? TX.slate}`}>
                          {lesson.subject}
                        </p>
                      </div>
                      {done ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full shrink-0">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Done
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-[#0f1f6b] dark:group-hover:text-white transition-colors">
                          Attendance →
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{lesson.classLabel}</span>
                      {lesson.groupLabel && <span className="text-slate-400 dark:text-slate-500">({lesson.groupLabel})</span>}
                      {lesson.room && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {lesson.room}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Weekly overview grid */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Weekly Overview</h2>
            <div className="bg-white dark:bg-[#1a2035] rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/10">
                    <th className="text-left px-4 py-3 text-slate-400 dark:text-slate-500 font-semibold text-xs uppercase tracking-wide w-20">Time</th>
                    {DAY_SHORT.map((d, i) => (
                      <th key={i} className={`px-3 py-3 text-xs uppercase tracking-wide font-semibold text-center ${
                        i === todayIndex ? "text-[#0f1f6b] dark:text-white" : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {d}
                        {i === todayIndex && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                      <td className="px-4 py-2 align-middle">
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">{row.time}</p>
                        {row.duration && <p className="text-[10px] text-slate-400 dark:text-slate-500">{row.duration}</p>}
                      </td>
                      {row.cells.map((lesson, di) => (
                        <td key={di} className="px-1.5 py-1.5">
                          {lesson ? (
                            <button
                              onClick={() => openModal(lesson)}
                              className={`w-full rounded-xl px-2 py-2 text-center min-h-[48px] flex flex-col items-center justify-center gap-0.5 border transition-all hover:shadow-sm hover:-translate-y-px ${BG[lesson.color] ?? BG.slate}`}
                            >
                              <span className={`font-semibold text-xs leading-tight ${TX[lesson.color] ?? TX.slate}`}>
                                {lesson.subject}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{lesson.classLabel}</span>
                            </button>
                          ) : (
                            <div className="min-h-[48px] rounded-xl flex items-center justify-center text-slate-200 dark:text-slate-700">
                              <span className="text-xs">—</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Attendance Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setModal(null)}
          />
          <div className="relative bg-white dark:bg-[#1a2035] rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className={`rounded-t-3xl px-6 py-5 border-b border-slate-100 dark:border-white/10`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${BG[modal.lesson.color] ?? BG.slate} ${TX[modal.lesson.color] ?? TX.slate}`}>
                      {modal.lesson.subject}
                    </span>
                    {modal.lesson.groupLabel && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">({modal.lesson.groupLabel})</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{modal.lesson.classLabel}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {modal.lesson.time}{modal.lesson.duration ? ` · ${modal.lesson.duration}` : ""}
                    {modal.lesson.room ? ` · ${modal.lesson.room}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Date selector */}
              <div className="flex items-center gap-3 mt-4">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Date</label>
                <input
                  type="date"
                  value={modal.date}
                  onChange={e => handleDateChange(e.target.value)}
                  className="flex-1 text-sm font-medium text-slate-700 dark:text-white bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-[#0f1f6b] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No students found</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    No accepted students match &quot;{modal.lesson.classLabel}&quot;.
                    <br />Ask admin to update student grade assignments.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary counts */}
                  <div className="flex items-center gap-2 pb-2">
                    {(["present", "late", "absent"] as const).map(s => {
                      const count = students.filter(st => st.status === s).length;
                      return (
                        <span key={s} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[s].bg}`}>
                          {count} {STATUS_CONFIG[s].label}
                        </span>
                      );
                    })}
                    <div className="flex-1" />
                    <button
                      onClick={() => markAll("present")}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                    >
                      All Present
                    </button>
                  </div>

                  {students.map(student => (
                    <div key={student.student_id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 dark:border-white/5 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                            {student.student_name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{student.student_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {(["present", "late", "absent"] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setStatus(student.student_id, s)}
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                              student.status === s
                                ? STATUS_CONFIG[s].bg + " shadow-sm"
                                : "bg-white dark:bg-transparent border-slate-200 dark:border-white/15 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-white/30"
                            }`}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex items-center gap-3">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAttendance}
                disabled={saving || modalLoading || students.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0f1f6b] hover:bg-[#1a30a0] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
