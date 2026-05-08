"use client";

import { useEffect, useState } from "react";

type Permission = {
  key: string;
  label: string;
  description: string;
};

const PERMISSIONS: Permission[] = [
  { key: "dashboard",           label: "Dashboard",           description: "View overview and stats" },
  { key: "students_view",       label: "Students tab",        description: "Access the Students section" },
  { key: "students_all",        label: "  → All",             description: "See every student regardless of status" },
  { key: "students_pending",    label: "  → Pending",         description: "See pending applications" },
  { key: "students_reviewed",   label: "  → Reviewed",        description: "See reviewed applications" },
  { key: "students_accepted",   label: "  → Accepted",        description: "See accepted students" },
  { key: "students_rejected",   label: "  → Rejected",        description: "See rejected applications" },
  { key: "students_edit",       label: "Edit Students",       description: "Edit student information" },
  { key: "students_accept",     label: "Accept / Reject",     description: "Change enrollment status" },
  { key: "visits",              label: "Visit Requests",      description: "View and manage visit bookings" },
  { key: "archive",             label: "Archive",             description: "Access the student archive" },
  { key: "reports",             label: "Reports",             description: "View analytics and reports" },
  { key: "school",              label: "School",              description: "Timetable, attendance, classes, teachers, events" },
  { key: "users",               label: "User Management",     description: "Create and manage admin users" },
];

const ROLE_PRESETS: Record<string, Record<string, boolean>> = {
  admin: {
    dashboard: true,
    students_view: true, students_all: true, students_pending: true,
    students_reviewed: true, students_accepted: true, students_rejected: true,
    students_edit: true, students_accept: true,
    visits: true, archive: true, reports: true, school: true, users: false,
  },
  staff: {
    dashboard: true,
    students_view: true, students_all: false, students_pending: false,
    students_reviewed: false, students_accepted: true, students_rejected: false,
    students_edit: false, students_accept: false,
    visits: false, archive: false, reports: false, school: true, users: false,
  },
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  active: boolean;
  created_at: string;
  profile?: Record<string, string>;
};

type LinkModal = { userId: string; userName: string; timetableTeachers: string[] };

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  admin:       "bg-blue-100 text-blue-800",
  staff:       "bg-slate-100 text-slate-700",
  teacher:     "bg-emerald-100 text-emerald-800",
};

const DEFAULT_PERMS: Record<string, boolean> = {
  dashboard: true,
  students_view: true, students_all: false, students_pending: false,
  students_reviewed: false, students_accepted: true, students_rejected: false,
  students_edit: false, students_accept: false,
  visits: false, archive: false, reports: false, school: false, users: false,
};

type Panel = { type: "add" } | { type: "edit"; user: AdminUser } | null;

export default function UsersManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [linkModal, setLinkModal] = useState<LinkModal | null>(null);
  const [linkSelected, setLinkSelected] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [perms, setPerms] = useState<Record<string, boolean>>(DEFAULT_PERMS);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setName(""); setEmail(""); setPassword(""); setRole("staff");
    setPerms({ ...DEFAULT_PERMS }); setError("");
    setPanel({ type: "add" });
  }

  function openEdit(user: AdminUser) {
    setName(user.name); setEmail(user.email); setPassword("");
    setRole(user.role); setPerms({ ...DEFAULT_PERMS, ...user.permissions }); setError("");
    setPanel({ type: "edit", user });
  }

  function applyRolePreset(r: string) {
    setRole(r);
    if (ROLE_PRESETS[r]) setPerms({ ...ROLE_PRESETS[r] });
  }

  async function handleSave() {
    if (!name || !email) { setError("Name and email are required."); return; }
    if (panel?.type === "add" && !password) { setError("Password is required."); return; }
    setSaving(true); setError("");
    try {
      const body = { name, email, role, permissions: perms, ...(password ? { password } : {}) };
      const url = panel?.type === "edit" ? `/api/admin/users/${panel.user.id}` : "/api/admin/users";
      const method = panel?.type === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }

      // For teacher role: check if name matches timetable, prompt to link if not
      if (role === "teacher") {
        const ttRes = await fetch("/api/timetable/teachers");
        const ttData = await ttRes.json();
        const timetableTeachers: string[] = ttData.teachers ?? [];

        if (timetableTeachers.length > 0 && !timetableTeachers.includes(name)) {
          // Reload users first to get the saved user's ID
          await load();
          const savedUsers = await fetch("/api/admin/users?role=teacher").then(r => r.json());
          const saved = Array.isArray(savedUsers) ? savedUsers.find((u: AdminUser) => u.email === email) : null;
          if (saved) {
            setPanel(null);
            setLinkSelected(timetableTeachers[0] ?? "");
            setLinkModal({ userId: saved.id, userName: name, timetableTeachers });
            return;
          }
        }
      }

      setPanel(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error saving user.");
    } finally { setSaving(false); }
  }

  async function handleLink() {
    if (!linkModal || !linkSelected) return;
    setLinkSaving(true);
    try {
      // Get current profile first
      const usersRes = await fetch("/api/admin/users");
      const allUsers: AdminUser[] = await usersRes.json();
      const user = allUsers.find(u => u.id === linkModal.userId);
      const currentProfile = user?.profile ?? {};

      await fetch(`/api/admin/users/${linkModal.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { ...currentProfile, timetable_name: linkSelected } }),
      });
      setLinkModal(null);
      await load();
    } finally {
      setLinkSaving(false);
    }
  }

  async function toggleActive(user: AdminUser) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    await load();
  }

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete user ${user.name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0f1f6b]">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Control who can access the admin panel and what they can do</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-all" style={{ background: "rgba(0,90,220,0.88)", border: "1px solid rgba(100,160,255,0.3)", boxShadow: "0 2px 12px rgba(0,90,220,0.28), inset 0 1px 0 rgba(255,255,255,0.2)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Super admin notice */}
      <div className="glass-sm px-4 py-3 mb-5 flex items-center gap-3">
        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-sm text-slate-700">
          The <strong className="text-slate-900">Super Admin</strong> account (set in .env) has full access and is not managed here.
        </p>
      </div>

      {/* Users list */}
      <div className="glass-card overflow-hidden mb-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No users yet. Add your first admin user.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/4 border-b border-slate-100 dark:border-white/6">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Access</th>
                <th className="text-left px-4 py-3 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/6">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/4 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                      {u.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "teacher" ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium w-fit">
                          Teacher Portal only
                        </span>
                        {u.profile?.timetable_name && u.profile.timetable_name !== u.name && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            → Linked as <span className="font-medium text-slate-600 dark:text-slate-300">{u.profile.timetable_name}</span> in timetable
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {PERMISSIONS.filter((p) => u.permissions?.[p.key]).map((p) => (
                          <span key={p.key} className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                            {p.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                        u.active
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-green-500" : "bg-slate-400"}`} />
                      {u.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="text-blue-700 hover:text-blue-900 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(u)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Side panel */}
      {panel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setPanel(null)} />
          <div className="w-full max-w-[420px] flex flex-col bg-white dark:bg-[#141c2e] shadow-2xl border-l border-slate-100 dark:border-white/8">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0f1f6b] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={panel.type === "add" ? "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" : "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"} />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white leading-none">
                    {panel.type === "add" ? "Add New User" : "Edit User"}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {panel.type === "add" ? "Create a new account" : `Editing ${(panel as {type:"edit";user:AdminUser}).user.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPanel(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">

                {/* Name field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Full Name *</label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Johnson"
                      className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Email field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Email *</label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah@cdi-laos.edu.la"
                      className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    {panel.type === "edit" ? "New Password" : "Password *"}
                    {panel.type === "edit" && <span className="ml-1 font-normal text-slate-400 dark:text-slate-500 normal-case">(leave blank to keep)</span>}
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-white/8" />

                {/* Role cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Role</label>
                  <div className="space-y-2">
                    {[
                      {
                        key: "admin",
                        label: "Admin",
                        description: "Full access to enrollment, students, and school management",
                        icon: (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        ),
                        activeColor: "border-blue-500 bg-blue-50 dark:bg-blue-500/15 dark:border-blue-400",
                        activeIconBg: "bg-white dark:bg-blue-500/20",
                        iconColor: "text-blue-600 dark:text-blue-400",
                        dotColor: "bg-blue-500 dark:bg-blue-400",
                        activeLabel: "text-slate-800 dark:text-white",
                      },
                      {
                        key: "staff",
                        label: "Staff",
                        description: "Limited access — can view accepted students only",
                        icon: (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        ),
                        activeColor: "border-slate-400 bg-slate-100 dark:bg-white/10 dark:border-slate-500",
                        activeIconBg: "bg-white dark:bg-white/10",
                        iconColor: "text-slate-600 dark:text-slate-300",
                        dotColor: "bg-slate-500 dark:bg-slate-400",
                        activeLabel: "text-slate-800 dark:text-white",
                      },
                      {
                        key: "teacher",
                        label: "Teacher",
                        description: "Teacher portal only — view timetable and take attendance",
                        icon: (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        ),
                        activeColor: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 dark:border-emerald-400",
                        activeIconBg: "bg-white dark:bg-emerald-500/20",
                        iconColor: "text-emerald-600 dark:text-emerald-400",
                        dotColor: "bg-emerald-500 dark:bg-emerald-400",
                        activeLabel: "text-slate-800 dark:text-white",
                      },
                    ].map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => applyRolePreset(r.key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          role === r.key
                            ? r.activeColor + " shadow-sm"
                            : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/4 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/8"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          role === r.key ? r.activeIconBg + " shadow-sm" : "bg-slate-100 dark:bg-white/8"
                        }`}>
                          <svg className={`w-4 h-4 ${role === r.key ? r.iconColor : "text-slate-400 dark:text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {r.icon}
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${role === r.key ? r.activeLabel : "text-slate-600 dark:text-slate-300"}`}>{r.label}</span>
                            {role === r.key && <span className={`w-1.5 h-1.5 rounded-full ${r.dotColor}`} />}
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{r.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                          role === r.key ? `${r.iconColor} border-current` : "border-slate-300 dark:border-white/20"
                        }`}>
                          {role === r.key && <div className={`w-2 h-2 rounded-full ${r.dotColor}`} />}
                        </div>
                      </button>
                    ))}
                  </div>
                  {role === "teacher" && (
                    <div className="flex items-start gap-2 mt-3 px-3 py-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        The full name here must match exactly what you entered for this teacher in the timetable generator.
                      </p>
                    </div>
                  )}
                </div>

                {/* Permissions — hidden for teacher role */}
                {role !== "teacher" && (
                  <>
                    <div className="border-t border-slate-100 dark:border-white/8" />
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Permissions</label>
                      <div className="space-y-1">
                        {PERMISSIONS.map((p) => {
                          const isOn = perms[p.key];
                          const isIndented = p.label.startsWith("  →");
                          return (
                            <div
                              key={p.key}
                              onClick={() => setPerms((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                                isIndented ? "ml-4" : ""
                              } ${isOn
                                ? "bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/30"
                                : "hover:bg-slate-50 dark:hover:bg-white/4 border border-transparent"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className={`text-sm font-medium leading-none ${isOn ? "text-blue-800 dark:text-blue-300" : "text-slate-600 dark:text-slate-300"}`}>
                                  {p.label.replace("  → ", "")}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.description}</p>
                              </div>
                              <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${isOn ? "bg-blue-600" : "bg-slate-200 dark:bg-white/15"}`}>
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${isOn ? "translate-x-4" : "translate-x-0.5"}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

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
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/8 bg-slate-50/60 dark:bg-white/4 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0f1f6b] hover:bg-[#1a30a0] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : panel.type === "add" ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create User
                  </>
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
                onClick={() => setPanel(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 bg-slate-100 dark:bg-white/8 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link-to-Timetable Modal ─────────────────────────────────────────── */}
      {linkModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141c2e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-md">
            {/* header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-white/8">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Link to Timetable</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{linkModal.userName}</span> was not found in the published timetable.
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Select which teacher name in the timetable belongs to this account. The teacher portal will use this link to show their lessons.
              </p>

              <div className="space-y-2">
                {linkModal.timetableTeachers.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setLinkSelected(t)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      linkSelected === t
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 dark:border-emerald-400"
                        : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/4"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className={`text-sm font-medium ${linkSelected === t ? "text-emerald-700 dark:text-emerald-300" : "text-slate-700 dark:text-slate-300"}`}>{t}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      linkSelected === t ? "border-emerald-500 dark:border-emerald-400" : "border-slate-300 dark:border-white/20"
                    }`}>
                      {linkSelected === t && <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />}
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">
                You can also skip this and rename the teacher account later so the names match exactly.
              </p>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/8">
              <button
                onClick={handleLink}
                disabled={!linkSelected || linkSaving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {linkSaving ? "Linking…" : "Link Account"}
              </button>
              <button
                onClick={() => setLinkModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 rounded-xl transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
