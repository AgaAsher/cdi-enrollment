"use client";

import { useEffect, useState } from "react";
import { Enrollment } from "@/lib/types";

type ParentAccount = {
  id: string;
  email: string;
  name: string;
  enrollment_ids: string[];
  active: boolean;
};

type ParentGroup = {
  email: string;
  name: string;
  phone: string;
  relationship: string;
  children: { id: string; name: string; grade: string }[];
};

function gradeShort(gradeKey: string): string {
  if (gradeKey.startsWith("Toddler"))   return "Toddler";
  if (gradeKey.startsWith("Nursery"))   return "Nursery";
  if (gradeKey.startsWith("Reception")) return "Reception";
  if (gradeKey.startsWith("Pre-KG"))    return "Pre-KG";
  return gradeKey;
}

export default function ParentsPortalView({ enrollments }: { enrollments: Enrollment[] }) {
  const [accounts, setAccounts] = useState<ParentAccount[]>([]);
  const [modal, setModal] = useState<{ parent: ParentGroup } | null>(null);

  // Modal form state
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formEnrollmentIds, setFormEnrollmentIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  async function loadAccounts() {
    const res = await fetch("/api/admin/parents");
    if (res.ok) {
      const data = await res.json();
      setAccounts(data);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  // Group accepted enrollments by parent1_email
  const accepted = enrollments.filter((e) => e.status === "accepted");
  const groupMap = new Map<string, ParentGroup>();
  for (const e of accepted) {
    const key = e.parent1_email.toLowerCase().trim();
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        email: e.parent1_email,
        name: e.parent1_full_name,
        phone: e.parent1_phone,
        relationship: e.parent1_relationship,
        children: [],
      });
    }
    groupMap.get(key)!.children.push({
      id: e.id,
      name: `${e.child_first_name} ${e.child_last_name}`,
      grade: e.applying_for_grade,
    });
  }
  const parentGroups = Array.from(groupMap.values());

  function accountFor(email: string) {
    return accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  function openModal(parent: ParentGroup) {
    setFormName(parent.name);
    setFormPassword("");
    setFormEnrollmentIds(parent.children.map((c) => c.id));
    setFormError("");
    setModal({ parent });
  }

  function closeModal() {
    setModal(null);
    setFormError("");
  }

  function toggleEnrollmentId(id: string) {
    setFormEnrollmentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          email: modal.parent.email,
          password: formPassword,
          enrollment_ids: formEnrollmentIds,
        }),
      });
      if (res.ok) {
        await loadAccounts();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error ?? "Something went wrong.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Parents Portal</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Manage parent portal accounts for accepted students&apos; families.
      </p>

      {parentGroups.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">No accepted students found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {parentGroups.map((parent) => {
            const account = accountFor(parent.email);
            const hasAccount = !!account;
            return (
              <div key={parent.email} className="glass-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Parent info */}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{parent.name}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400">
                        {parent.relationship}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{parent.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{parent.phone}</p>

                    {/* Children tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {parent.children.map((child) => (
                        <span
                          key={child.id}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20"
                        >
                          {child.name} · {gradeShort(child.grade)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status + action */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        hasAccount
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-white/8 dark:text-slate-400"
                      }`}
                    >
                      {hasAccount ? "Active" : "No account"}
                    </span>
                    <button
                      onClick={() => openModal(parent)}
                      className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors ${
                        hasAccount
                          ? "bg-slate-100 hover:bg-slate-200 dark:bg-white/8 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {hasAccount ? "Manage" : "Create Account"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white dark:bg-[#1a2035] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                {accountFor(modal.parent.email) ? "Manage Account" : "Create Parent Account"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (readonly) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={modal.parent.email}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-sm px-3 py-2.5 cursor-not-allowed"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
                  Password {accountFor(modal.parent.email) && <span className="text-slate-400 font-normal normal-case">(leave blank to keep current)</span>}
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Set a password"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Children checkboxes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  Children (Enrollment Access)
                </label>
                <div className="space-y-2">
                  {modal.parent.children.map((child) => (
                    <label key={child.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formEnrollmentIds.includes(child.id)}
                        onChange={() => toggleEnrollmentId(child.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-blue-600 accent-blue-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {child.name}
                        <span className="ml-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                          {gradeShort(child.grade)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60"
                >
                  {formLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
