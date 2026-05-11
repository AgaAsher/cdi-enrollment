"use client";

import { useState, useEffect, useRef } from "react";

const MEALS = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack"];
const DAYS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const MEAL_COLORS: Record<string, string> = {
  "Breakfast":      "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
  "Morning Snack":  "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
  "Lunch":          "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20",
  "Afternoon Snack":"bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20",
};

type MenuData = Record<string, Record<string, string>>;

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtRange(monday: Date): string {
  const friday = addDays(monday, 4);
  const fmt = (d: Date) => d.toLocaleDateString("en", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(friday)}`;
}

function emptyMenu(): MenuData {
  const m: MenuData = {};
  for (const day of DAYS) {
    m[day] = {};
    for (const meal of MEALS) m[day][meal] = "";
  }
  return m;
}

export default function WeeklyMenuView({ canEdit }: { canEdit: boolean }) {
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const [menu, setMenu] = useState<MenuData>(emptyMenu());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editCell, setEditCell] = useState<{ day: string; meal: string } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const weekStart = isoDate(monday);

  useEffect(() => {
    setLoading(true);
    setMenu(emptyMenu());
    fetch(`/api/admin/menu?week=${weekStart}`)
      .then(r => r.json())
      .then(d => {
        if (d.menu_data) {
          const merged = emptyMenu();
          for (const day of DAYS) {
            for (const meal of MEALS) {
              merged[day][meal] = d.menu_data[day]?.[meal] ?? "";
            }
          }
          setMenu(merged);
        }
      })
      .finally(() => setLoading(false));
  }, [weekStart]);

  function prevWeek() { setMonday(d => addDays(d, -7)); setSaved(false); }
  function nextWeek() { setMonday(d => addDays(d,  7)); setSaved(false); }

  function setValue(day: string, meal: string, value: string) {
    setMenu(prev => ({ ...prev, [day]: { ...prev[day], [meal]: value } }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_start: weekStart, menu_data: menu }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/menu/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { menu_data } = await res.json();
      const merged = emptyMenu();
      for (const day of DAYS) {
        for (const meal of MEALS) {
          merged[day][meal] = menu_data[day]?.[meal] ?? "";
        }
      }
      setMenu(merged);
      setSaved(false);
    }
    setUploadLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const hasAnyContent = DAYS.some(d => MEALS.some(m => menu[d]?.[m]));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Weekly Menu</h1>

        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download sample */}
            <a
              href="/api/admin/menu/sample"
              download
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-xl hover:border-slate-300 dark:hover:border-white/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Sample
            </a>

            {/* Upload Excel */}
            <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-xl hover:border-slate-300 dark:hover:border-white/20 transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploadLoading ? "Reading…" : "Upload Excel"}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleUpload}
                disabled={uploadLoading}
              />
            </label>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0f1f6b] hover:bg-[#1a30a0] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors"
            >
              {saving ? (
                <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
              ) : saved ? (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Saved</>
              ) : (
                "Save Menu"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={prevWeek}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-white">{fmtRange(monday)}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Week of {monday.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={nextWeek}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-slate-400"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Menu grid */}
      {loading ? (
        <div className="glass-card p-16 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#0f1f6b] dark:border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide w-36">Meal</th>
                  {DAYS.map((day, i) => {
                    const date = addDays(monday, i);
                    const isToday = isoDate(date) === isoDate(new Date());
                    return (
                      <th key={day} className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide ${isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"}`}>
                        <span>{DAY_SHORT[i]}</span>
                        {isToday && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block align-middle" />}
                        <div className="text-[10px] font-normal mt-0.5 opacity-70">
                          {date.toLocaleDateString("en", { day: "numeric", month: "short" })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {MEALS.map((meal, mi) => (
                  <tr key={meal} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${MEAL_COLORS[meal]}`}>
                        {meal}
                      </span>
                    </td>
                    {DAYS.map(day => {
                      const isEditing = canEdit && editCell?.day === day && editCell?.meal === meal;
                      const value = menu[day]?.[meal] ?? "";
                      return (
                        <td key={day} className="px-2 py-2 align-top">
                          {isEditing ? (
                            <textarea
                              autoFocus
                              value={value}
                              onChange={e => setValue(day, meal, e.target.value)}
                              onBlur={() => setEditCell(null)}
                              rows={3}
                              placeholder="Enter meal…"
                              className="w-full text-xs text-slate-700 dark:text-white bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/40 rounded-xl px-2.5 py-2 outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                            />
                          ) : (
                            <div
                              onClick={() => canEdit && setEditCell({ day, meal })}
                              className={`min-h-[60px] rounded-xl px-2.5 py-2 text-xs leading-relaxed transition-colors ${
                                canEdit
                                  ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                  : ""
                              } ${value ? "text-slate-700 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"}`}
                            >
                              {value || (canEdit ? <span className="text-[11px] italic">Click to add…</span> : "—")}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!hasAnyContent && !loading && (
            <div className="px-6 pb-5 pt-2 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                {canEdit ? "No menu for this week. Click a cell to add or upload an Excel file." : "No menu available for this week."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
