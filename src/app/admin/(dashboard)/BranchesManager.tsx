"use client";

import { useState, useEffect, useCallback } from "react";

type Branch = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  active: boolean;
};

type FormState = { name: string; code: string; address: string };
const EMPTY: FormState = { name: "", code: "", address: "" };

export default function BranchesManager() {
  const [branches, setBranches]   = useState<Branch[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [form, setForm]           = useState<FormState>(EMPTY);
  const [editId, setEditId]       = useState<string | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/branches");
    const json = await res.json();
    setBranches((json.branches ?? []) as Branch[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startCreate() {
    setEditId(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  function startEdit(b: Branch) {
    setEditId(b.id);
    setForm({ name: b.name, code: b.code, address: b.address ?? "" });
    setError("");
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
    setError("");
  }

  async function save() {
    if (!form.name.trim() || !form.code.trim()) {
      setError("Name and code are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/branches", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { id: editId, ...form } : form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong."); return; }
      await load();
      cancel();
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    setSaving(true);
    await fetch("/api/admin/branches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
    setSaving(false);
    setConfirmDel(null);
  }

  async function reactivate(id: string) {
    setSaving(true);
    await fetch("/api/admin/branches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: true }),
    });
    await load();
    setSaving(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Branches</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage school branches. Each branch has its own isolated data.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f1f6b] hover:bg-[#1a3fa8] text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Branch
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="glass-card p-5 mb-6">
          <h2 className="text-sm font-bold text-[#0f1f6b] dark:text-white mb-4">
            {editId ? "Edit Branch" : "New Branch"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Branch Name <span className="text-red-400">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Vientiane Main Campus"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f1f6b]/20 dark:focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Branch Code <span className="text-red-400">*</span>
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. VTE-01"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f1f6b]/20 dark:focus:ring-blue-500/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Address
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="e.g. Ban Phonxay, Vientiane Capital"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f1f6b]/20 dark:focus:ring-blue-500/30"
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs text-red-500 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#0f1f6b] hover:bg-[#1a3fa8] text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : editId ? "Save Changes" : "Create Branch"}
            </button>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Branch list */}
      {loading ? (
        <div className="glass-card p-8 text-center text-sm text-slate-400">Loading…</div>
      ) : branches.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <svg className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No branches yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Create your first branch to get started.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/8">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Branch</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Code</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 hidden sm:table-cell">Address</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#0f1f6b]/8 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-[#0f1f6b]/60 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span className="font-medium text-slate-800 dark:text-white">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">{b.code}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs hidden sm:table-cell">
                    {b.address ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${
                      b.active
                        ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-white/8 text-slate-400 dark:text-slate-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {b.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0f1f6b] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {b.active ? (
                        <button
                          onClick={() => setConfirmDel(b.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Deactivate"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => reactivate(b.id)}
                          disabled={saving}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-60"
                          title="Reactivate"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deactivate confirmation */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1a2035] rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-200 dark:border-white/10">
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Deactivate branch?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              The branch will be hidden but its data will not be deleted. You can reactivate it later.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDel(null)}
                className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deactivate(confirmDel)}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-60"
              >
                {saving ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
