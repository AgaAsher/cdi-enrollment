"use client";

import { useState, useEffect, useCallback } from "react";

type TeacherProfile = {
  job: string;
  birthday: string;
  phone: string;
  nationality: string;
  timetable_name?: string;
};

type Teacher = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
  profile: TeacherProfile;
};

// A merged row: timetable name + optional linked account
type TeacherRow = {
  timetableName: string;
  account: Teacher | null;
};

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-500",
];

function avatarGradient(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0].toUpperCase()).join("").slice(0, 2);
}

function age(birthday: string): string {
  if (!birthday) return "";
  const diff = Date.now() - new Date(birthday).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${years} yrs`;
}

type PanelMode = { mode: "add" } | { mode: "edit"; teacher: Teacher };

const EMPTY_PROFILE: TeacherProfile = { job: "", birthday: "", phone: "", nationality: "" };

export default function TeachersSection() {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<PanelMode | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(true);
  const [profile, setProfile] = useState<TeacherProfile>(EMPTY_PROFILE);

  const load = useCallback(async () => {
    setLoading(true);
    const [accRes, ttRes] = await Promise.all([
      fetch("/api/admin/users?role=teacher"),
      fetch("/api/timetable/teachers"),
    ]);
    const accounts: Teacher[] = await accRes.json().then(d => Array.isArray(d) ? d : []);
    const timetableNames: string[] = await ttRes.json().then(d => d.teachers ?? []);

    // For each timetable name, find matching account (by name or profile.timetable_name)
    const used = new Set<string>();
    const merged: TeacherRow[] = timetableNames.map(tName => {
      const acc = accounts.find(a =>
        a.name === tName ||
        (a.profile as TeacherProfile)?.timetable_name === tName
      ) ?? null;
      if (acc) used.add(acc.id);
      return { timetableName: tName, account: acc };
    });

    // Also include teacher accounts not in timetable (e.g. admin-created but not yet in timetable)
    for (const acc of accounts) {
      if (!used.has(acc.id)) {
        merged.push({ timetableName: acc.name, account: acc });
      }
    }

    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd(prefillName = "") {
    setName(prefillName); setEmail(""); setPassword(""); setActive(true);
    setProfile({ ...EMPTY_PROFILE }); setError("");
    setPanel({ mode: "add" });
  }

  function openEdit(t: Teacher) {
    setName(t.name); setEmail(t.email); setPassword(""); setActive(t.active);
    setProfile({ ...EMPTY_PROFILE, ...t.profile }); setError("");
    setPanel({ mode: "edit", teacher: t });
  }

  function closePanel() { setPanel(null); setError(""); }

  async function save() {
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    if (panel?.mode === "add" && !password) { setError("Password is required."); return; }
    setSaving(true); setError("");
    try {
      const body = {
        name: name.trim(),
        email: email.trim(),
        role: "teacher",
        permissions: {},
        active,
        profile,
        ...(password ? { password } : {}),
      };
      const url  = panel?.mode === "edit" ? `/api/admin/users/${panel.teacher.id}` : "/api/admin/users";
      const method = panel?.mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Error saving."); }
      closePanel();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error saving.");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (panel?.mode !== "edit") return;
    if (!confirm(`Delete ${panel.teacher.name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users/${panel.teacher.id}`, { method: "DELETE" });
    closePanel(); await load();
  }

  const currentTeacher = panel?.mode === "edit" ? panel.teacher : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Teachers & Staff</h1>
        <button
          onClick={() => openAdd()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Teacher
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-5 h-28 animate-pulse bg-slate-100 dark:bg-white/4" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 dark:bg-white/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No teachers yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Add teachers in the timetable generator or click &ldquo;Add Teacher&rdquo;.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((row) => {
              const t = row.account;
              const displayName = t?.name ?? row.timetableName;
              const hasAccount = !!t;
              return (
                <div
                  key={row.timetableName}
                  onDoubleClick={() => t && openEdit(t)}
                  title={hasAccount ? "Double-click to edit profile" : "Click to create account"}
                  className={`glass-card p-5 flex items-start gap-4 cursor-pointer hover:shadow-md hover:-translate-y-px transition-all select-none group ${!hasAccount ? "ring-1 ring-amber-300/40 dark:ring-amber-500/20" : ""}`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient(displayName)} flex items-center justify-center shrink-0 shadow-md ${!hasAccount ? "opacity-50" : ""}`}>
                    <span className="text-sm font-bold text-white">{getInitials(displayName)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{displayName}</p>
                      {hasAccount && !t.active && (
                        <span className="text-[9px] font-bold bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {t?.profile?.job || "Teacher"}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {hasAccount ? (
                        <>
                          {t.profile?.nationality && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300">
                              {t.profile.nationality}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            Has account
                          </span>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); openAdd(row.timetableName); }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          No account — create one
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">Double-click a card to edit the teacher&apos;s profile.</p>
        </>
      )}

      {/* Profile panel */}
      {panel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={closePanel} />
          <div className="w-full max-w-[440px] flex flex-col bg-white dark:bg-[#141c2e] shadow-2xl border-l border-slate-100 dark:border-white/8">

            {/* Panel header */}
            <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-white/8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                    name ? avatarGradient(name) : "from-slate-400 to-slate-500"
                  } flex items-center justify-center shadow-md shrink-0`}>
                    <span className="text-sm font-bold text-white">
                      {name ? getInitials(name) : "?"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                      {currentTeacher ? currentTeacher.name : "New Teacher"}
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {currentTeacher
                        ? profile.job || "Teacher"
                        : "Create a teacher account"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Active toggle */}
                  <button
                    type="button"
                    onClick={() => setActive(a => !a)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                        : "bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/12"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={closePanel}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Quick stats row (edit mode) */}
              {currentTeacher && (
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  {profile.birthday && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {age(profile.birthday)}
                    </span>
                  )}
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {profile.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Since {new Date(currentTeacher.created_at).toLocaleDateString("en", { month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* ── Personal Information ── */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Personal Information</p>
                  <div className="space-y-3">

                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Full Name *</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Ms. Khamla Vongsay"
                          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Job title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Job Title / Subject</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <input
                          value={profile.job}
                          onChange={e => setProfile(p => ({ ...p, job: e.target.value }))}
                          placeholder="e.g. Early Learning Teacher"
                          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Birthday + Nationality (2 col) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Date of Birth</label>
                        <input
                          type="date"
                          value={profile.birthday}
                          onChange={e => setProfile(p => ({ ...p, birthday: e.target.value }))}
                          className="w-full px-3 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Nationality</label>
                        <input
                          value={profile.nationality}
                          onChange={e => setProfile(p => ({ ...p, nationality: e.target.value }))}
                          placeholder="e.g. Lao"
                          className="w-full px-3 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Contact Number</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <input
                          value={profile.phone}
                          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+856 20 ..."
                          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-white/8" />

                {/* ── Portal Access ── */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Portal Access</p>
                  <div className="space-y-3">

                    {/* Email / username */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Login Email (Username) *</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="teacher@cdi-laos.edu.la"
                          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        {panel.mode === "edit" ? "New Password" : "Password *"}
                        {panel.mode === "edit" && <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">(blank = keep current)</span>}
                      </label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <input
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        Teachers use this email &amp; password to log in at <span className="font-mono font-semibold">/admin/login</span> and access their portal.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/8 bg-slate-50/60 dark:bg-white/4 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0f1f6b] hover:bg-[#1a30a0] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                ) : panel.mode === "add" ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Create Teacher</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Save Profile</>
                )}
              </button>
              {panel.mode === "edit" && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={closePanel}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 bg-slate-100 dark:bg-white/8 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
