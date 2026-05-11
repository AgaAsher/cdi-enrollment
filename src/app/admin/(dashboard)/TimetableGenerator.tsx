"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Room = { id: string; name: string };
type ClassGroup = { id: string; name: string };

type SubjectEntry = {
  id: string;
  name: string;
  teacher: string;
  room: string;
  group: string;   // "all" | ClassGroup.id
  days: "1" | "2" | "3" | "4" | "5";
  blocked: string[]; // `${dayIdx},${lessonIdx}` — slots this subject cannot be placed
};

type ClassCfg = {
  key: string;
  label: string;
  colorClass: string;
  startTime: string;
  endTime: string;
  lessonsPerDay: string;
  groups: ClassGroup[];
  subjects: SubjectEntry[];
};

// cells[dayIdx] = array of parallel entries (one per group in a split lesson, or one "all")
type SlotCell = { subject: string; teacher: string; room: string; group: string; groupLabel: string; isFixed: boolean };
type GRow = { time: string; duration: string; color: string; cells: SlotCell[][] };
type ClassOut = { label: string; startTime: string; endTime: string; lessonsPerDay: number; rows: GRow[] };
type Output = Record<string, ClassOut>;

type LessonTime = { start: string; end: string };
type Conflict = { type: "teacher" | "room"; name: string; time: string; day: string; classes: string[] };
type LessonCard = { cardId: string; subject: string; teacher: string; room: string; group: string; groupLabel: string; color: string };

// ─── Constants ────────────────────────────────────────────────────────────────


const GRADE_DEFS = [
  { key: "toddler",   label: "Toddler",   colorClass: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"             },
  { key: "nursery",   label: "Nursery",   colorClass: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"     },
  { key: "reception", label: "Reception", colorClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  { key: "pkg",       label: "Pre-KG",    colorClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"         },
] as const;

const FIXED = [
  { time: "8:00",  dur: "30 min", name: "Morning Circle", color: "blue"   },
  { time: "9:30",  dur: "30 min", name: "Snack & Break",  color: "amber"  },
  { time: "10:00", dur: "45 min", name: "Outdoor Play",   color: "green"  },
  { time: "11:15", dur: "45 min", name: "Lunch",          color: "orange" },
  { time: "12:00", dur: "2 hr",   name: "Rest Time",      color: "slate"  },
  { time: "15:30", dur: "",       name: "Dismissal",      color: "slate"  },
];

const VAR = [
  { time: "8:30",  dur: "1 hr",   color: "indigo" },
  { time: "10:45", dur: "30 min", color: "purple" },
  { time: "14:00", dur: "45 min", color: "pink"   },
  { time: "14:45", dur: "45 min", color: "violet" },
];

const toMin = (t: string) => { const [h, m = 0] = t.split(":").map(Number); return h * 60 + m; };

const VAR_COLORS = ["indigo", "purple", "pink", "violet", "blue", "green", "orange", "amber"] as const;

function calcDur(start: string, end: string): string {
  const mins = toMin(end) - toMin(start);
  if (mins <= 0) return "";
  if (mins % 60 === 0) return `${mins / 60} hr`;
  if (mins > 60) return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
  return `${mins} min`;
}

function buildOrdered(lessonTimes: LessonTime[]) {
  const dynVAR = lessonTimes.map((lt, i) => ({
    time: lt.start, dur: calcDur(lt.start, lt.end),
    color: VAR_COLORS[i % VAR_COLORS.length],
    fixed: false as const, vi: i, name: "",
  }));
  return [
    ...FIXED.map(s => ({ ...s, fixed: true as const, vi: -1 })),
    ...dynVAR,
  ].sort((a, b) => toMin(a.time) - toMin(b.time));
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

const BG: Record<string, string> = {
  blue:   "bg-blue-100 dark:bg-blue-500/20",   indigo: "bg-indigo-100 dark:bg-indigo-500/20",
  amber:  "bg-amber-100 dark:bg-amber-500/20", green:  "bg-emerald-100 dark:bg-emerald-500/20",
  purple: "bg-purple-100 dark:bg-purple-500/20", orange: "bg-orange-100 dark:bg-orange-500/20",
  pink:   "bg-pink-100 dark:bg-pink-500/20",   violet: "bg-violet-100 dark:bg-violet-500/20",
  slate:  "bg-slate-100 dark:bg-white/6",
};
const TX: Record<string, string> = {
  blue:   "text-blue-800 dark:text-blue-200",   indigo: "text-indigo-800 dark:text-indigo-200",
  amber:  "text-amber-800 dark:text-amber-200", green:  "text-emerald-800 dark:text-emerald-200",
  purple: "text-purple-800 dark:text-purple-200", orange: "text-orange-800 dark:text-orange-200",
  pink:   "text-pink-800 dark:text-pink-200",   violet: "text-violet-800 dark:text-violet-200",
  slate:  "text-slate-500 dark:text-slate-400",
};

function uid() { return Math.random().toString(36).slice(2, 9); }
function hashColor(name: string): string {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return VAR_COLORS[h % VAR_COLORS.length];
}
function subjectToCard(e: SubjectEntry, cls: ClassCfg, roomById: Record<string, string>): Omit<LessonCard, "cardId"> {
  return {
    subject: e.name, teacher: e.teacher,
    room: e.room ? (roomById[e.room] ?? e.room) : "",
    group: e.group,
    groupLabel: e.group === "all" ? "" : (cls.groups.find(g => g.id === e.group)?.name ?? ""),
    color: hashColor(e.name),
  };
}

function defaultClasses(): ClassCfg[] {
  const subs: Record<string, Array<Omit<SubjectEntry, "id" | "blocked" | "group">>> = {
    toddler:   [
      { name: "Learning Centers", teacher: "", room: "", days: "3" },
      { name: "Art & Crafts",     teacher: "", room: "", days: "2" },
      { name: "Music & Movement", teacher: "", room: "", days: "2" },
      { name: "Story Time",       teacher: "", room: "", days: "3" },
    ],
    nursery:   [
      { name: "Language Arts",    teacher: "", room: "", days: "3" },
      { name: "Art & Crafts",     teacher: "", room: "", days: "2" },
      { name: "Music & Movement", teacher: "", room: "", days: "2" },
      { name: "Story Time",       teacher: "", room: "", days: "3" },
    ],
    reception: [
      { name: "STEM Exploration", teacher: "", room: "", days: "3" },
      { name: "Drama Play",       teacher: "", room: "", days: "2" },
      { name: "Music & Dance",    teacher: "", room: "", days: "2" },
      { name: "Language Arts",    teacher: "", room: "", days: "3" },
    ],
    pkg:       [
      { name: "Pre-Primary",      teacher: "", room: "", days: "3" },
      { name: "Creative Play",    teacher: "", room: "", days: "2" },
      { name: "Week Celebration", teacher: "", room: "", days: "1" },
      { name: "Show & Tell",      teacher: "", room: "", days: "3" },
    ],
  };
  return GRADE_DEFS.map(g => ({
    key: g.key, label: g.label, colorClass: g.colorClass,
    startTime: "08:00", endTime: "15:30", lessonsPerDay: "4",
    groups: [],
    subjects: (subs[g.key] ?? []).map(s => ({ ...s, id: uid(), group: "all", blocked: [] })),
  }));
}

// ─── Generation algorithm ─────────────────────────────────────────────────────

function interleave(subjects: SubjectEntry[]): SubjectEntry[] {
  const active = subjects.filter(s => s.name.trim());
  if (!active.length) return [];
  const maxD = Math.max(...active.map(s => parseInt(s.days)));
  const out: SubjectEntry[] = [];
  for (let i = 0; i < maxD; i++) {
    for (const s of active) {
      if (i < parseInt(s.days)) out.push(s);
    }
  }
  return out;
}

function runGenerate(
  classes: ClassCfg[],
  rooms: Room[],
  lessonTimes: LessonTime[],
  teacherAvail: Record<string, string[]>,
): { output: Output; pool: Record<string, LessonCard[]>; conflicts: Conflict[] } {
  const roomById = Object.fromEntries(rooms.filter(r => r.name).map(r => [r.id, r.name]));
  const dynVAR = lessonTimes.map((lt, i) => ({
    time: lt.start, dur: calcDur(lt.start, lt.end),
    color: VAR_COLORS[i % VAR_COLORS.length],
  }));
  const ORDERED = buildOrdered(lessonTimes);
  const output: Output = {};
  const grids: Record<string, SubjectEntry[][][]> = {};
  const poolByClass: Record<string, LessonCard[]> = {};

  for (const cls of classes) {
    const maxSlots = parseInt(cls.lessonsPerDay);
    const grid: SubjectEntry[][][] = dynVAR.map(() => Array.from({ length: 5 }, () => []));

    const allPool = interleave(cls.subjects.filter(s => s.group === "all"));
    const groupPools: Record<string, SubjectEntry[]> = {};
    for (const g of cls.groups) {
      groupPools[g.id] = interleave(cls.subjects.filter(s => s.group === g.id));
    }

    const slotOrder: [number, number][] = [];
    for (let d = 0; d < 5; d++) {
      for (let s = 0; s < Math.min(maxSlots, dynVAR.length); s++) {
        slotOrder.push([s, d]);
      }
    }

    for (const [s, d] of slotOrder) {
      const hasGroupSubjects = cls.groups.some(g => (groupPools[g.id]?.length ?? 0) > 0);

      if (hasGroupSubjects) {
        const placed: SubjectEntry[] = [];
        for (const g of cls.groups) {
          const pool = groupPools[g.id];
          if (!pool || pool.length === 0) continue;
          const idx = pool.findIndex(e => {
            if (e.blocked.includes(`${d},${s}`)) return false;
            if ((teacherAvail[e.teacher] ?? []).includes(`${d},${s}`)) return false;
            return true;
          });
          if (idx >= 0) placed.push(pool.splice(idx, 1)[0]);
        }
        if (placed.length > 0) { grid[s][d] = placed; continue; }
      }

      if (allPool.length > 0) {
        const idx = allPool.findIndex(e => {
          if (e.blocked.includes(`${d},${s}`)) return false;
          if ((teacherAvail[e.teacher] ?? []).includes(`${d},${s}`)) return false;
          return true;
        });
        if (idx >= 0) grid[s][d] = [allPool.splice(idx, 1)[0]];
      }
    }

    grids[cls.key] = grid;

    // Pool: remaining unplaced after greedy fill
    const remaining = [...allPool];
    for (const g of cls.groups) remaining.push(...(groupPools[g.id] ?? []));
    poolByClass[cls.key] = remaining.map(e => ({ cardId: uid(), ...subjectToCard(e, cls, roomById) }));

    const rows: GRow[] = ORDERED.map(slot => {
      if (slot.fixed) {
        return {
          time: slot.time, duration: slot.dur, color: slot.color,
          cells: DAYS.map(() => [{ subject: slot.name, teacher: "", room: "", group: "all", groupLabel: "", isFixed: true }]),
        };
      }
      if (slot.vi >= maxSlots) {
        return {
          time: slot.time, duration: slot.dur, color: slot.color,
          cells: DAYS.map(() => [{ subject: "", teacher: "", room: "", group: "all", groupLabel: "", isFixed: false }]),
        };
      }
      return {
        time: slot.time, duration: slot.dur, color: slot.color,
        cells: (grid[slot.vi] ?? Array.from({ length: 5 }, () => [])).map((entries): SlotCell[] =>
          entries.length > 0
            ? entries.map(e => ({
                subject: e.name,
                teacher: e.teacher,
                room: e.room ? (roomById[e.room] ?? e.room) : "",
                group: e.group,
                groupLabel: e.group === "all" ? "" : (cls.groups.find(g => g.id === e.group)?.name ?? ""),
                isFixed: false,
              }))
            : [{ subject: "", teacher: "", room: "", group: "all", groupLabel: "", isFixed: false }]
        ),
      };
    });

    output[cls.key] = { label: cls.label, startTime: cls.startTime, endTime: cls.endTime, lessonsPerDay: maxSlots, rows };
  }

  const tAt: Record<string, string[]> = {};
  const rAt: Record<string, string[]> = {};

  for (const cls of classes) {
    const maxSlots = parseInt(cls.lessonsPerDay);
    for (let s = 0; s < Math.min(maxSlots, dynVAR.length); s++) {
      for (let d = 0; d < 5; d++) {
        const entries = grids[cls.key]?.[s]?.[d] ?? [];
        const slotDay = `${dynVAR[s].time}|${DAYS[d]}`;
        for (const e of entries) {
          if (e.teacher) (tAt[`${e.teacher}|${slotDay}`] ??= []).push(cls.label);
          if (e.room) {
            const rName = roomById[e.room] ?? e.room;
            (rAt[`${rName}|${slotDay}`] ??= []).push(cls.label);
          }
        }
      }
    }
  }

  const conflicts: Conflict[] = [];
  for (const [k, cls] of Object.entries(tAt)) {
    if (cls.length > 1) {
      const [name, time, day] = k.split("|");
      conflicts.push({ type: "teacher", name, time, day, classes: cls });
    }
  }
  for (const [k, cls] of Object.entries(rAt)) {
    if (cls.length > 1) {
      const [name, time, day] = k.split("|");
      conflicts.push({ type: "room", name, time, day, classes: cls });
    }
  }

  return { output, pool: poolByClass, conflicts };
}

// Cross-class aware re-generation: prevents teachers/rooms being double-booked across classes
function runGenerateFixed(
  classes: ClassCfg[],
  rooms: Room[],
  lessonTimes: LessonTime[],
  teacherAvail: Record<string, string[]>,
): { output: Output; pool: Record<string, LessonCard[]>; conflicts: Conflict[] } {
  const roomById = Object.fromEntries(rooms.filter(r => r.name).map(r => [r.id, r.name]));
  const dynVAR = lessonTimes.map((lt, i) => ({
    time: lt.start, dur: calcDur(lt.start, lt.end),
    color: VAR_COLORS[i % VAR_COLORS.length],
  }));
  const ORDERED = buildOrdered(lessonTimes);
  const output: Output = {};
  const grids: Record<string, SubjectEntry[][][]> = {};
  const poolByClass: Record<string, LessonCard[]> = {};
  const teacherAt = new Set<string>();
  const roomAt    = new Set<string>();

  const allPools:   Record<string, SubjectEntry[]>                 = {};
  const groupPools: Record<string, Record<string, SubjectEntry[]>> = {};
  for (const cls of classes) {
    grids[cls.key]      = dynVAR.map(() => Array.from({ length: 5 }, () => []));
    allPools[cls.key]   = interleave(cls.subjects.filter(s => s.group === "all"));
    groupPools[cls.key] = {};
    for (const g of cls.groups) {
      groupPools[cls.key][g.id] = interleave(cls.subjects.filter(s => s.group === g.id));
    }
  }

  const maxLessons = Math.max(0, ...classes.map(c => parseInt(c.lessonsPerDay)));

  // Fill slot-by-slot across all classes so global constraints are respected
  for (let d = 0; d < 5; d++) {
    for (let s = 0; s < Math.min(maxLessons, dynVAR.length); s++) {
      for (const cls of classes) {
        const maxSlots = parseInt(cls.lessonsPerDay);
        if (s >= maxSlots) continue;

        const grid  = grids[cls.key];
        const aPool = allPools[cls.key];
        const gPool = groupPools[cls.key];

        const canPlace = (e: SubjectEntry) => {
          if (e.blocked.includes(`${d},${s}`)) return false;
          if ((teacherAvail[e.teacher] ?? []).includes(`${d},${s}`)) return false;
          if (e.teacher && teacherAt.has(`${e.teacher}|${s}|${d}`)) return false;
          if (e.room && roomAt.has(`${roomById[e.room] ?? e.room}|${s}|${d}`)) return false;
          return true;
        };
        const markOccupied = (e: SubjectEntry) => {
          if (e.teacher) teacherAt.add(`${e.teacher}|${s}|${d}`);
          if (e.room) roomAt.add(`${roomById[e.room] ?? e.room}|${s}|${d}`);
        };

        const hasGroupSubjects = cls.groups.some(g => (gPool[g.id]?.length ?? 0) > 0);
        if (hasGroupSubjects) {
          const placed: SubjectEntry[] = [];
          for (const g of cls.groups) {
            const pool = gPool[g.id];
            if (!pool?.length) continue;
            const idx = pool.findIndex(canPlace);
            if (idx >= 0) placed.push(pool.splice(idx, 1)[0]);
          }
          if (placed.length > 0) {
            grid[s][d] = placed;
            placed.forEach(markOccupied);
            continue;
          }
        }

        if (aPool.length > 0) {
          const idx = aPool.findIndex(canPlace);
          if (idx >= 0) {
            const e = aPool.splice(idx, 1)[0];
            grid[s][d] = [e];
            markOccupied(e);
          }
        }
      }
    }
  }

  // Pool: gather remaining unplaced from each class's pools
  for (const cls of classes) {
    const remaining = [...allPools[cls.key]];
    for (const g of cls.groups) remaining.push(...(groupPools[cls.key][g.id] ?? []));
    poolByClass[cls.key] = remaining.map(e => ({ cardId: uid(), ...subjectToCard(e, cls, roomById) }));
  }

  // Build rows (identical logic to runGenerate)
  for (const cls of classes) {
    const maxSlots = parseInt(cls.lessonsPerDay);
    const grid = grids[cls.key];
    const rows: GRow[] = ORDERED.map(slot => {
      if (slot.fixed) return {
        time: slot.time, duration: slot.dur, color: slot.color,
        cells: DAYS.map(() => [{ subject: slot.name, teacher: "", room: "", group: "all", groupLabel: "", isFixed: true }]),
      };
      if (slot.vi >= maxSlots) return {
        time: slot.time, duration: slot.dur, color: slot.color,
        cells: DAYS.map(() => [{ subject: "", teacher: "", room: "", group: "all", groupLabel: "", isFixed: false }]),
      };
      return {
        time: slot.time, duration: slot.dur, color: slot.color,
        cells: (grid[slot.vi] ?? Array.from({ length: 5 }, () => [])).map((entries): SlotCell[] =>
          entries.length > 0
            ? entries.map(e => ({
                subject: e.name, teacher: e.teacher,
                room: e.room ? (roomById[e.room] ?? e.room) : "",
                group: e.group,
                groupLabel: e.group === "all" ? "" : (cls.groups.find(g => g.id === e.group)?.name ?? ""),
                isFixed: false,
              }))
            : [{ subject: "", teacher: "", room: "", group: "all", groupLabel: "", isFixed: false }]
        ),
      };
    });
    output[cls.key] = { label: cls.label, startTime: cls.startTime, endTime: cls.endTime, lessonsPerDay: maxSlots, rows };
  }

  // Conflict detection
  const tAt: Record<string, string[]> = {};
  const rAt: Record<string, string[]> = {};
  for (const cls of classes) {
    const maxSlots = parseInt(cls.lessonsPerDay);
    for (let s = 0; s < Math.min(maxSlots, dynVAR.length); s++) {
      for (let d = 0; d < 5; d++) {
        const entries = grids[cls.key]?.[s]?.[d] ?? [];
        const slotDay = `${dynVAR[s].time}|${DAYS[d]}`;
        for (const e of entries) {
          if (e.teacher) (tAt[`${e.teacher}|${slotDay}`] ??= []).push(cls.label);
          if (e.room) (rAt[`${roomById[e.room] ?? e.room}|${slotDay}`] ??= []).push(cls.label);
        }
      }
    }
  }
  const conflicts: Conflict[] = [];
  for (const [k, cls] of Object.entries(tAt)) {
    if (cls.length > 1) { const [name, time, day] = k.split("|"); conflicts.push({ type: "teacher", name, time, day, classes: cls }); }
  }
  for (const [k, cls] of Object.entries(rAt)) {
    if (cls.length > 1) { const [name, time, day] = k.split("|"); conflicts.push({ type: "room", name, time, day, classes: cls }); }
  }
  return { output, pool: poolByClass, conflicts };
}

// ─── Availability Grid Modal ──────────────────────────────────────────────────

const SHORT_DAYS = ["Mo", "Tu", "We", "Th", "Fr"];

function AvailabilityGrid({
  title,
  subtitle,
  blocked,
  lessonCount,
  onToggle,
  onClose,
}: {
  title: string;
  subtitle: string;
  blocked: string[];
  lessonCount: number;
  onToggle: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a2035] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/8">
          <div>
            <h3 className="text-sm font-bold text-[#0f1f6b] dark:text-white">{title}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 transition-colors ml-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="p-5 overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-10" />
                {Array.from({ length: lessonCount }, (_, i) => (
                  <th key={i} className="w-11 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 pb-2">
                    L{i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHORT_DAYS.map((day, d) => (
                <tr key={d}>
                  <td className="pr-3 text-xs font-bold text-slate-500 dark:text-slate-400 text-right">{day}</td>
                  {Array.from({ length: lessonCount }, (_, l) => {
                    const key = `${d},${l}`;
                    const isBlocked = blocked.includes(key);
                    return (
                      <td key={l} className="p-0.5">
                        <button
                          onClick={() => onToggle(key)}
                          title={isBlocked ? "Blocked — click to unblock" : "Available — click to block"}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                            isBlocked
                              ? "bg-slate-200 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-500/15 text-slate-400 dark:text-white/30"
                              : "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                          }`}
                        >
                          {isBlocked ? (
                            <svg className="w-4 h-4 text-slate-400 dark:text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 pb-5 flex items-center gap-5 text-xs text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            Available
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center">
              <svg className="w-3 h-3 text-slate-400 dark:text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            Blocked
          </div>
          <span className="text-[10px] italic">Click a cell to toggle</span>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const inputCls ="text-xs px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-white/20 outline-none focus:border-blue-400 transition-colors w-full";

export default function TimetableGenerator({ onClose }: { onClose: (published?: boolean) => void }) {
  const [step, setStep] = useState<"configure" | "preview" | "published">("configure");
  const [rooms, setRooms] = useState<Room[]>([
    { id: uid(), name: "Room A" },
    { id: uid(), name: "Room B" },
    { id: uid(), name: "Art Room" },
    { id: uid(), name: "Music Room" },
  ]);
  const [classes, setClasses] = useState<ClassCfg[]>(defaultClasses);
  const [expanded, setExpanded] = useState<string>("toddler");
  const [output, setOutput]     = useState<Output | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [activeClass, setActiveClass] = useState("toddler");
  const [lessonTimes, setLessonTimes] = useState<LessonTime[]>([
    { start: "08:30", end: "09:30" },
    { start: "10:45", end: "11:15" },
    { start: "14:00", end: "14:45" },
    { start: "14:45", end: "15:30" },
  ]);
  const [openSections, setOpenSections] = useState({ rooms: true, teachers: false, lessonTimes: true });
  const toggleSection = (s: keyof typeof openSections) =>
    setOpenSections(p => ({ ...p, [s]: !p[s] }));
  const [teacherAvail, setTeacherAvail] = useState<Record<string, string[]>>({});
  const [availModal, setAvailModal] = useState<{
    kind: "subject"; classKey: string; subjectId: string; name: string;
  } | {
    kind: "teacher"; name: string;
  } | null>(null);
  const [publishing, setPublishing]   = useState(false);
  const [pubError, setPubError]       = useState<string | null>(null);
  const [pubLinks, setPubLinks]       = useState<Array<{ label: string; url: string }> | null>(null);
  const [teachersList, setTeachersList] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users?role=teacher").then(r => r.json()),
      fetch("/api/timetable/teachers").then(r => r.json()),
    ]).then(([accountData, ttData]) => {
      const fromAccounts: string[] = Array.isArray(accountData)
        ? accountData.map((u: { name: string }) => u.name)
        : [];
      const fromTimetable: string[] = ttData.teachers ?? [];
      const merged = [...new Set([...fromAccounts, ...fromTimetable])].sort();
      setTeachersList(merged);
    }).catch(() => {});
  }, []);
  const [pool, setPool]             = useState<Record<string, LessonCard[]>>({});
  const [activeDrag, setActiveDrag] = useState<
    | { kind: "pool"; card: LessonCard }
    | { kind: "grid"; ri: number; di: number }
    | null
  >(null);
  const [dragOverGrid, setDragOverGrid] = useState<{ ri: number; di: number } | null>(null);
  const [dragOverPool, setDragOverPool] = useState(false);

  // ── Room handlers ───────────────────────────────────────────────────────────
  const addRoom    = () => setRooms(p => [...p, { id: uid(), name: "" }]);
  const setRoomName = (id: string, name: string) => setRooms(p => p.map(r => r.id === id ? { ...r, name } : r));
  const delRoom    = (id: string) => setRooms(p => p.filter(r => r.id !== id));

  // ── Subject handlers ─────────────────────────────────────────────────────
  const addSubject = (ck: string) => setClasses(p => p.map(c => c.key !== ck ? c : {
    ...c, subjects: [...c.subjects, { id: uid(), name: "", teacher: teachersList[0] ?? "", room: "", group: "all", days: "3" as const, blocked: [] }],
  }));
  const updSubject = (ck: string, id: string, f: keyof SubjectEntry, v: string) =>
    setClasses(p => p.map(c => c.key !== ck ? c : {
      ...c, subjects: c.subjects.map(s => s.id !== id ? s : { ...s, [f]: v }),
    }));
  const delSubject = (ck: string, id: string) => setClasses(p => p.map(c => c.key !== ck ? c : {
    ...c, subjects: c.subjects.filter(s => s.id !== id),
  }));

  // ── Group handlers ───────────────────────────────────────────────────────
  const addGroup = (ck: string) => setClasses(p => p.map(c => c.key !== ck ? c : {
    ...c, groups: [...c.groups, { id: uid(), name: "" }],
  }));
  const updateGroup = (ck: string, gid: string, name: string) => setClasses(p => p.map(c => c.key !== ck ? c : {
    ...c, groups: c.groups.map(g => g.id !== gid ? g : { ...g, name }),
  }));
  const delGroup = (ck: string, gid: string) => setClasses(p => p.map(c => c.key !== ck ? c : {
    ...c,
    groups: c.groups.filter(g => g.id !== gid),
    subjects: c.subjects.map(s => s.group === gid ? { ...s, group: "all" } : s),
  }));

  // ── Actions ─────────────────────────────────────────────────────────────
  function handleGenerate() {
    const { output: o, pool: p, conflicts: c } = runGenerate(classes, rooms, lessonTimes, teacherAvail);
    setOutput(o); setPool(p); setConflicts(c);
    setActiveClass(classes[0]?.key ?? "toddler");
    setStep("preview");
  }

  function handleFixConflicts() {
    const { output: o, pool: p, conflicts: c } = runGenerateFixed(classes, rooms, lessonTimes, teacherAvail);
    setOutput(o); setPool(p); setConflicts(c);
  }

  function clearDrag() { setActiveDrag(null); setDragOverGrid(null); setDragOverPool(false); }

  function handleDropOnGrid(ri: number, di: number) {
    if (!activeDrag || !output) { clearDrag(); return; }
    const clsKey = activeClass;
    if (output[clsKey]?.rows[ri]?.cells[di]?.[0]?.isFixed) { clearDrag(); return; }

    if (activeDrag.kind === "pool") {
      const card = activeDrag.card;
      const newCell: SlotCell = { subject: card.subject, teacher: card.teacher, room: card.room, group: card.group, groupLabel: card.groupLabel, isFixed: false };
      setOutput(prev => {
        if (!prev) return prev;
        const cls = prev[clsKey];
        const rows = cls.rows.map((row, i) => i !== ri ? row : { ...row, cells: row.cells.map((c, d) => d !== di ? c : [newCell]) });
        return { ...prev, [clsKey]: { ...cls, rows } };
      });
      setPool(prev => ({ ...prev, [clsKey]: (prev[clsKey] ?? []).filter(c => c.cardId !== card.cardId) }));
    } else {
      const { ri: srcRi, di: srcDi } = activeDrag;
      if (srcRi === ri && srcDi === di) { clearDrag(); return; }
      setOutput(prev => {
        if (!prev) return prev;
        const cls = prev[clsKey];
        const rows = cls.rows.map((row, i) => i === srcRi || i === ri ? { ...row, cells: [...row.cells] } : row);
        const tmp = rows[srcRi].cells[srcDi];
        rows[srcRi].cells[srcDi] = rows[ri].cells[di];
        rows[ri].cells[di] = tmp;
        return { ...prev, [clsKey]: { ...cls, rows } };
      });
    }
    clearDrag();
  }

  function handleDropOnPool() {
    if (!activeDrag || activeDrag.kind !== "grid" || !output) { clearDrag(); return; }
    const { ri, di } = activeDrag;
    const clsKey = activeClass;
    const src = output[clsKey]?.rows[ri]?.cells[di]?.[0];
    if (!src || src.isFixed || !src.subject) { clearDrag(); return; }

    const card: LessonCard = { cardId: uid(), subject: src.subject, teacher: src.teacher, room: src.room, group: src.group, groupLabel: src.groupLabel, color: hashColor(src.subject) };
    const empty: SlotCell = { subject: "", teacher: "", room: "", group: "all", groupLabel: "", isFixed: false };
    setOutput(prev => {
      if (!prev) return prev;
      const cls = prev[clsKey];
      const rows = cls.rows.map((row, i) => i !== ri ? row : { ...row, cells: row.cells.map((c, d) => d !== di ? c : [empty]) });
      return { ...prev, [clsKey]: { ...cls, rows } };
    });
    setPool(prev => ({ ...prev, [clsKey]: [...(prev[clsKey] ?? []), card] }));
    clearDrag();
  }

  async function handlePublish() {
    if (!output) return;
    setPublishing(true);
    setPubError(null);
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timetable_data: output, academic_year: "2025–2026" }),
      });
      if (!res.ok) throw new Error(await res.text());

      const origin = window.location.origin;
      const links: Array<{ label: string; url: string }> = [];

      // Class links
      for (const key of Object.keys(output)) {
        links.push({ label: `${output[key].label} (class)`, url: `${origin}/timetable?class=${key}` });
      }
      // Teacher links
      const teacherSet = new Set<string>();
      for (const cls of classes) cls.subjects.forEach(s => { if (s.teacher) teacherSet.add(s.teacher); });
      for (const t of Array.from(teacherSet)) {
        links.push({ label: t, url: `${origin}/timetable?teacher=${encodeURIComponent(t)}` });
      }

      setPubLinks(links);
      setStep("published");
    } catch (e) {
      setPubError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const availBlocked: string[] = availModal === null ? [] :
    availModal.kind === "teacher"
      ? (teacherAvail[availModal.name] ?? [])
      : (classes.find(c => c.key === availModal.classKey)?.subjects.find(s => s.id === availModal.subjectId)?.blocked ?? []);

  function handleAvailToggle(key: string) {
    if (!availModal) return;
    if (availModal.kind === "teacher") {
      setTeacherAvail(p => {
        const cur = p[availModal.name] ?? [];
        return { ...p, [availModal.name]: cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key] };
      });
    } else {
      setClasses(p => p.map(c => c.key !== availModal.classKey ? c : {
        ...c,
        subjects: c.subjects.map(s => s.id !== availModal.subjectId ? s : {
          ...s,
          blocked: s.blocked.includes(key) ? s.blocked.filter(k => k !== key) : [...s.blocked, key],
        }),
      }));
    }
  }

  return (
    <>
    {availModal && (
      <AvailabilityGrid
        title={availModal.kind === "teacher" ? availModal.name : availModal.name}
        subtitle={availModal.kind === "teacher"
          ? "Grey slots = teacher unavailable (will not be scheduled there)"
          : "Grey slots = subject blocked (will not be placed in this slot)"}
        blocked={availBlocked}
        lessonCount={lessonTimes.length}
        onToggle={handleAvailToggle}
        onClose={() => setAvailModal(null)}
      />
    )}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col bg-white dark:bg-[#1a2035] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <h2 className="text-base font-bold text-[#0f1f6b] dark:text-white">Timetable Generator</h2>
            <div className="flex items-center gap-1 ml-1">
              {(["configure", "preview", "published"] as const).map(s => (
                <div key={s} className={`rounded-full transition-all duration-300 ${step === s ? "w-5 h-1.5 bg-blue-500" : "w-1.5 h-1.5 bg-slate-200 dark:bg-white/15"}`} />
              ))}
            </div>
          </div>
          <button onClick={() => onClose()} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">

          {/* ── CONFIGURE ── */}
          {step === "configure" && (
            <div className="h-full flex overflow-hidden">

              {/* Left panel */}
              <div className="w-64 shrink-0 border-r border-slate-100 dark:border-white/8 flex flex-col overflow-y-auto">

                {/* ── Rooms ── */}
                <div className="border-b border-slate-100 dark:border-white/8">
                  <button
                    onClick={() => toggleSection("rooms")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rooms</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{rooms.length}</span>
                      <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.rooms ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {openSections.rooms && (
                    <div className="px-4 pb-3 space-y-1.5">
                      {rooms.map(r => (
                        <div key={r.id} className="flex items-center gap-1.5 group/room">
                          <input
                            value={r.name}
                            onChange={e => setRoomName(r.id, e.target.value)}
                            placeholder="Room name"
                            className={inputCls}
                          />
                          <button onClick={() => delRoom(r.id)} className="opacity-0 group-hover/room:opacity-100 p-1 rounded text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-all shrink-0">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {rooms.length === 0 && <p className="text-xs text-slate-300 dark:text-white/20 text-center py-1">No rooms yet</p>}
                      <button onClick={addRoom} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors pt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Add room
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Teachers ── */}
                <div className="border-b border-slate-100 dark:border-white/8">
                  <button
                    onClick={() => toggleSection("teachers")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Teachers</span>
                    <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.teachers ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openSections.teachers && (
                    <div className="px-4 pb-3 space-y-1.5">
                      {teachersList.map(t => (
                        <div
                          key={t}
                          onDoubleClick={() => setAvailModal({ kind: "teacher", name: t })}
                          title="Double-click to set availability"
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-white/3 cursor-default hover:bg-slate-100 dark:hover:bg-white/6 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-bold text-white">
                              {t.split(" ").filter((_, i) => i > 0).map(w => w[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate leading-tight flex-1">{t}</span>
                          {(teacherAvail[t] ?? []).length > 0 && (
                            <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 rounded shrink-0">
                              {teacherAvail[t].length}×
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Lesson Times ── */}
                <div>
                  <button
                    onClick={() => toggleSection("lessonTimes")}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
                  >
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lesson Times</span>
                    <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openSections.lessonTimes ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openSections.lessonTimes && (
                    <div className="px-4 pb-3 space-y-2">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">Start &amp; end time for each lesson slot.</p>
                      {lessonTimes.map((lt, i) => (
                        <div key={i} className="space-y-1 group/lt">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              Lesson {i + 1}
                              {lt.start && lt.end && (
                                <span className="ml-1 font-normal text-slate-300 dark:text-white/30">
                                  ({calcDur(lt.start, lt.end)})
                                </span>
                              )}
                            </span>
                            {lessonTimes.length > 1 && (
                              <button
                                onClick={() => setLessonTimes(p => p.filter((_, j) => j !== i))}
                                className="opacity-0 group-hover/lt:opacity-100 p-0.5 rounded text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-all"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">Start</p>
                              <input
                                type="time"
                                value={lt.start}
                                onChange={e => setLessonTimes(p => p.map((x, j) => j === i ? { ...x, start: e.target.value } : x))}
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">End</p>
                              <input
                                type="time"
                                value={lt.end}
                                onChange={e => setLessonTimes(p => p.map((x, j) => j === i ? { ...x, end: e.target.value } : x))}
                                className={inputCls}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setLessonTimes(p => [...p, { start: "", end: "" }])}
                        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors pt-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Add lesson
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Right panel: Classes */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                  Add subjects for each class and assign teachers and rooms. Days/wk controls how often each subject appears.
                </p>

                {classes.map(cls => {
                  const named = cls.subjects.filter(s => s.name.trim()).length;
                  return (
                    <div key={cls.key} className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setExpanded(expanded === cls.key ? "" : cls.key)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls.colorClass}`}>{cls.label}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{named} subject{named !== 1 ? "s" : ""}</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded === cls.key ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expanded === cls.key && (
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-white/8">
                          {/* Class-level settings */}
                          <div className="flex flex-wrap items-center gap-3 pt-3 pb-3 border-b border-slate-100 dark:border-white/8 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">Start</span>
                              <input
                                type="time"
                                value={cls.startTime}
                                onChange={e => setClasses(p => p.map(c => c.key !== cls.key ? c : { ...c, startTime: e.target.value }))}
                                className={inputCls + " w-28"}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">End</span>
                              <input
                                type="time"
                                value={cls.endTime}
                                onChange={e => setClasses(p => p.map(c => c.key !== cls.key ? c : { ...c, endTime: e.target.value }))}
                                className={inputCls + " w-28"}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide whitespace-nowrap">Lessons/day</span>
                              <select
                                value={cls.lessonsPerDay}
                                onChange={e => setClasses(p => p.map(c => c.key !== cls.key ? c : { ...c, lessonsPerDay: e.target.value }))}
                                className={inputCls + " w-24"}
                              >
                                {Array.from({ length: lessonTimes.length }, (_, i) => String(i + 1)).map(n => (
                                  <option key={n} value={n}>{n} lesson{n !== "1" ? "s" : ""}</option>
                                ))}
                              </select>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              = {parseInt(cls.lessonsPerDay) * 5} lessons/week capacity
                            </span>
                          </div>

                          {/* Groups */}
                          <div className="pt-2 pb-3 border-b border-slate-100 dark:border-white/8 mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Groups</span>
                              <button
                                onClick={() => addGroup(cls.key)}
                                className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                Add group
                              </button>
                            </div>
                            {cls.groups.length === 0 ? (
                              <p className="text-[10px] text-slate-300 dark:text-white/25 italic">No groups — all subjects apply to the whole class.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {cls.groups.map(g => (
                                  <div key={g.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 group/grp">
                                    <input
                                      value={g.name}
                                      onChange={e => updateGroup(cls.key, g.id, e.target.value)}
                                      placeholder="Group name"
                                      className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-transparent outline-none w-24 placeholder:text-slate-300 dark:placeholder:text-white/20"
                                    />
                                    <button
                                      onClick={() => delGroup(cls.key, g.id)}
                                      className="opacity-0 group-hover/grp:opacity-100 text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-all"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {cls.subjects.length > 0 && (
                            <div className="grid gap-2 pt-1 pb-1" style={{ gridTemplateColumns: "1fr 150px 110px 56px 80px 28px" }}>
                              {["Subject", "Teacher", "Room", "Lessons/wk", "Group", ""].map(h => (
                                <span key={h} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{h}</span>
                              ))}
                            </div>
                          )}
                          <div className="space-y-1.5">
                            {cls.subjects.map(sub => (
                              <div
                                key={sub.id}
                                onDoubleClick={() => setAvailModal({ kind: "subject", classKey: cls.key, subjectId: sub.id, name: sub.name || "Subject" })}
                                title="Double-click to set slot availability"
                                className="grid gap-2 items-center group/sub"
                                style={{ gridTemplateColumns: "1fr 150px 110px 56px 80px 28px" }}
                              >
                                <div className="relative">
                                  <input
                                    value={sub.name}
                                    onChange={e => updSubject(cls.key, sub.id, "name", e.target.value)}
                                    placeholder="Subject name"
                                    className={inputCls}
                                  />
                                  {sub.blocked.length > 0 && (
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 rounded pointer-events-none">
                                      {sub.blocked.length}×
                                    </span>
                                  )}
                                </div>
                                <select
                                  value={sub.teacher}
                                  onChange={e => updSubject(cls.key, sub.id, "teacher", e.target.value)}
                                  className={inputCls}
                                >
                                  <option value="">— Teacher —</option>
                                  {teachersList.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select
                                  value={sub.room}
                                  onChange={e => updSubject(cls.key, sub.id, "room", e.target.value)}
                                  className={inputCls}
                                >
                                  <option value="">— Room —</option>
                                  {rooms.filter(r => r.name.trim()).map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                  ))}
                                </select>
                                <select
                                  value={sub.days}
                                  onChange={e => updSubject(cls.key, sub.id, "days", e.target.value)}
                                  className={inputCls + " text-center"}
                                >
                                  {(["1", "2", "3", "4", "5"] as const).map(d => (
                                    <option key={d} value={d}>{d}×</option>
                                  ))}
                                </select>
                                <select
                                  value={sub.group}
                                  onChange={e => updSubject(cls.key, sub.id, "group", e.target.value)}
                                  className={inputCls}
                                >
                                  <option value="all">Whole class</option>
                                  {cls.groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name || "Unnamed group"}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => delSubject(cls.key, sub.id)}
                                  className="opacity-0 group-hover/sub:opacity-100 w-7 h-7 flex items-center justify-center rounded text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 transition-all"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => addSubject(cls.key)}
                            className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            Add subject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {step === "preview" && output && (
            <div className="h-full flex flex-col overflow-hidden">
              {/* Class tabs */}
              <div className="flex items-center justify-between gap-2 px-6 pt-3 pb-0 shrink-0 border-b border-slate-100 dark:border-white/8">
                <div className="flex items-center gap-0.5">
                  {classes.map(cls => (
                    <button
                      key={cls.key}
                      onClick={() => setActiveClass(cls.key)}
                      className={`px-4 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors ${
                        activeClass === cls.key
                          ? "border-blue-500 text-[#0f1f6b] dark:text-white"
                          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      }`}
                    >
                      {cls.label}
                    </button>
                  ))}
                </div>
                {output?.[activeClass] && (
                  <div className="flex items-center gap-3 pb-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {output[activeClass].startTime} – {output[activeClass].endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      {output[activeClass].lessonsPerDay} lessons/day · {output[activeClass].lessonsPerDay * 5}/week
                    </span>
                  </div>
                )}
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-auto p-5">
                {conflicts.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {conflicts.length} scheduling conflict{conflicts.length > 1 ? "s" : ""} — go back and adjust assignments
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {conflicts.map((c, i) => (
                        <p key={i} className="text-[11px] text-amber-700 dark:text-amber-300">
                          {c.type === "teacher" ? "👤" : "🏛"} <strong>{c.name}</strong> is double-booked — {c.day} {c.time} ({c.classes.join(" & ")})
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {output[activeClass] && (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/8">
                    <table className="w-full text-xs min-w-[720px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/3 border-b border-slate-100 dark:border-white/8">
                          <th className="text-left px-4 py-2.5 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide text-[10px] w-24">Time</th>
                          {DAYS.map(d => (
                            <th key={d} className="px-2 py-2.5 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide text-[10px] text-center">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {output[activeClass].rows.map((row, ri) => {
                          const isFixed = row.cells[0]?.[0]?.isFixed;
                          return (
                            <tr key={ri} className="border-b border-slate-100 dark:border-white/6 last:border-0">
                              <td className="px-4 py-1.5 align-middle">
                                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">{row.time}</p>
                                {row.duration && <p className="text-[10px] text-slate-400 dark:text-slate-500">{row.duration}</p>}
                              </td>
                              {row.cells.map((cellArr, di) => {
                                const isSplit = cellArr.length > 1;
                                const subject = cellArr[0]?.subject;
                                const canDrag = !isFixed && !!subject;
                                const isBeingDragged = activeDrag?.kind === "grid" && activeDrag.ri === ri && activeDrag.di === di;
                                const isDragTarget   = dragOverGrid?.ri === ri && dragOverGrid?.di === di;
                                const isDraggingAny  = !!activeDrag;
                                return (
                                  <td
                                    key={di}
                                    className="px-1.5 py-1.5"
                                    onDragOver={!isFixed ? e => { e.preventDefault(); setDragOverGrid({ ri, di }); } : undefined}
                                    onDragLeave={!isFixed ? () => setDragOverGrid(null) : undefined}
                                    onDrop={!isFixed ? () => handleDropOnGrid(ri, di) : undefined}
                                  >
                                    {isSplit ? (
                                      <div className="flex flex-col gap-0.5">
                                        {cellArr.map((cell, gi) => (
                                          <div key={gi} className={`rounded-md px-2 py-1 text-center flex flex-col items-center gap-0.5 ${BG[row.color]} ${TX[row.color]}`}>
                                            {cell.groupLabel && <span className="text-[8px] font-bold opacity-60 uppercase tracking-wide leading-none">{cell.groupLabel}</span>}
                                            <span className="font-semibold text-[10px] leading-tight">{cell.subject || "—"}</span>
                                            {cell.teacher && <span className="text-[8px] opacity-70 leading-none">{cell.teacher.split(" ").slice(-1)[0]}</span>}
                                            {cell.room && <span className="text-[8px] opacity-55 leading-none">{cell.room}</span>}
                                          </div>
                                        ))}
                                      </div>
                                    ) : isFixed ? (
                                      /* Fixed activity */
                                      <div className={`rounded-lg px-2 py-1.5 text-center min-h-[46px] flex flex-col items-center justify-center gap-0.5 ${BG[row.color]} ${TX[row.color]}`}>
                                        <span className="font-semibold text-xs leading-tight">{subject || "—"}</span>
                                      </div>
                                    ) : subject ? (
                                      /* Placed lesson — draggable */
                                      <div
                                        draggable
                                        onDragStart={() => setActiveDrag({ kind: "grid", ri, di })}
                                        onDragEnd={() => clearDrag()}
                                        className={`relative rounded-lg px-2 pt-2 pb-1.5 text-center min-h-[52px] flex flex-col items-center justify-center gap-0.5 transition-all group/cell select-none cursor-grab active:cursor-grabbing
                                          ${BG[row.color]} ${TX[row.color]}
                                          ${isBeingDragged ? "opacity-25 scale-95" : "hover:shadow-md hover:scale-[1.02]"}
                                          ${isDragTarget ? "ring-2 ring-blue-400 dark:ring-blue-400 ring-offset-1" : ""}
                                        `}
                                      >
                                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/cell:opacity-30 transition-opacity pointer-events-none">
                                          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                                            <circle cx="4" cy="2.5" r="1"/><circle cx="8" cy="2.5" r="1"/>
                                            <circle cx="4" cy="6"   r="1"/><circle cx="8" cy="6"   r="1"/>
                                            <circle cx="4" cy="9.5" r="1"/><circle cx="8" cy="9.5" r="1"/>
                                          </svg>
                                        </div>
                                        <span className="font-semibold text-xs leading-tight">{subject}</span>
                                        {cellArr[0]?.teacher && <span className="text-[9px] opacity-70 leading-tight">{cellArr[0].teacher.split(" ").slice(-1)[0]}</span>}
                                        {cellArr[0]?.room && <span className="text-[9px] opacity-55 leading-tight">{cellArr[0].room}</span>}
                                      </div>
                                    ) : (
                                      /* Missing lesson slot — drop target */
                                      <div className={`rounded-lg min-h-[52px] flex flex-col items-center justify-center gap-0.5 transition-all border-2 border-dashed
                                        ${isDragTarget
                                          ? "border-blue-400 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/15 scale-[1.02]"
                                          : isDraggingAny
                                            ? "border-slate-300 dark:border-white/15 bg-slate-50/60 dark:bg-white/3"
                                            : "border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-white/2"
                                        }
                                      `}>
                                        {isDragTarget ? (
                                          <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400">Drop here</span>
                                        ) : (
                                          <>
                                            <svg className="w-3 h-3 text-slate-300 dark:text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-[9px] text-slate-300 dark:text-white/15">missing</span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Waiting list pool ── */}
              <div
                className={`shrink-0 border-t-2 transition-colors ${
                  dragOverPool
                    ? "border-blue-400 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-500/10"
                    : "border-slate-100 dark:border-white/8 bg-white dark:bg-[#1a2035]"
                }`}
                onDragOver={activeDrag?.kind === "grid" ? e => { e.preventDefault(); setDragOverPool(true); } : undefined}
                onDragLeave={() => setDragOverPool(false)}
                onDrop={activeDrag?.kind === "grid" ? () => { handleDropOnPool(); setDragOverPool(false); } : undefined}
              >
                {/* Pool header */}
                <div className="flex items-center justify-between px-5 py-2 border-b border-slate-100 dark:border-white/8">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Waiting list</span>
                    {(pool[activeClass]?.length ?? 0) > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                        {pool[activeClass].length} unplaced
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300 dark:text-white/25 italic">
                    {activeDrag?.kind === "grid" ? "↓ drop here to unplace" : "drag a card into a lesson slot above"}
                  </span>
                </div>

                {/* Pool cards */}
                <div className="flex gap-2 px-5 py-3 overflow-x-auto min-h-[72px] items-start">
                  {(pool[activeClass]?.length ?? 0) === 0 ? (
                    <div className="flex items-center self-center text-xs text-slate-300 dark:text-white/20 italic select-none">
                      {activeDrag?.kind === "grid"
                        ? "Drop here to remove this lesson from the timetable"
                        : "All lessons placed — drag a lesson card from the grid here to free up that slot"}
                    </div>
                  ) : (
                    pool[activeClass].map(card => (
                      <div
                        key={card.cardId}
                        draggable
                        onDragStart={() => setActiveDrag({ kind: "pool", card })}
                        onDragEnd={() => clearDrag()}
                        className={`shrink-0 cursor-grab active:cursor-grabbing select-none flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all ${BG[card.color]} ${TX[card.color]}`}
                      >
                        <span className="font-bold leading-tight">{card.subject || "—"}</span>
                        {card.teacher && <span className="text-[9px] opacity-60 leading-none">{card.teacher.split(" ").slice(-1)[0]}</span>}
                        {card.groupLabel && <span className="text-[8px] opacity-50 uppercase leading-none">{card.groupLabel}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PUBLISHED ── */}
          {step === "published" && pubLinks && (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-xl w-full space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Timetable Published!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Copy and share these links with teachers and students.
                  </p>
                </div>

                <div className="glass-card p-4 space-y-2 overflow-y-auto max-h-72">
                  {pubLinks.map(({ label, url }) => (
                    <div key={label} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-44 shrink-0 truncate">{label}</span>
                      <span className="flex-1 text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">{url}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(url)}
                        className="shrink-0 px-2 py-1 text-[10px] font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/8 shrink-0">
          {step === "configure" && (
            <>
              <button onClick={() => onClose()} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors px-3 py-2">
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Generate Timetable
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                onClick={() => setStep("configure")}
                className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors px-3 py-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back
              </button>
              <div className="flex items-center gap-3">
                {pubError && <span className="text-xs text-red-500 dark:text-red-400">{pubError}</span>}
                {conflicts.length > 0 && (
                  <button
                    onClick={handleFixConflicts}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Fix {conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}
                  </button>
                )}
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-colors shadow-sm ${
                    publishing
                      ? "bg-slate-100 dark:bg-white/8 text-slate-400 dark:text-white/30 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {publishing ? "Publishing…" : "Publish Timetable"}
                </button>
              </div>
            </>
          )}

          {step === "published" && (
            <div className="flex justify-end w-full">
              <button
                onClick={() => onClose(true)}
                className="px-5 py-2 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 text-slate-700 dark:text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
    </>
  );
}
