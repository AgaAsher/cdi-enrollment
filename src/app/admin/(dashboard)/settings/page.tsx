"use client";

import { useState, useEffect } from "react";

type Settings = {
  email_parent_subject: string;
  email_parent_message: string;
  email_admin_subject: string;
  enrollment_academic_years: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
      <h2 className="font-semibold text-blue-900 dark:text-white text-base mb-4 pb-2 border-b border-slate-100 dark:border-white/10">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const textareaCls = `${inputCls} resize-y font-mono`;

export default function SettingsPage() {
  const [tab, setTab] = useState<"email" | "form">("email");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setError("Failed to load settings"));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function update(key: keyof Settings, value: string) {
    setSettings((s) => s ? { ...s, [key]: value } : s);
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage email templates and enrollment form options.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 w-fit">
        {(["email", "form"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white"
            }`}
          >
            {t === "email" ? "Email Templates" : "Enrollment Settings"}
          </button>
        ))}
      </div>

      {!settings ? (
        <div className="text-slate-400 dark:text-slate-500 text-sm py-8 text-center">Loading…</div>
      ) : tab === "email" ? (
        <>
          <Section title="Parent Confirmation Email">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Sent to the parent automatically when an enrollment form is submitted. Use{" "}
              <code className="bg-slate-100 dark:bg-white/10 px-1 rounded">{"{parent_name}"}</code>,{" "}
              <code className="bg-slate-100 dark:bg-white/10 px-1 rounded">{"{child_name}"}</code>,{" "}
              <code className="bg-slate-100 dark:bg-white/10 px-1 rounded">{"{grade}"}</code> as placeholders.
            </p>
            <Field label="Subject">
              <input
                className={inputCls}
                value={settings.email_parent_subject}
                onChange={(e) => update("email_parent_subject", e.target.value)}
              />
            </Field>
            <Field label="Message body">
              <textarea
                className={textareaCls}
                rows={8}
                value={settings.email_parent_message}
                onChange={(e) => update("email_parent_message", e.target.value)}
              />
            </Field>
          </Section>

          <Section title="Admin Notification Email">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              Sent to the school admin when a new enrollment is received. Use{" "}
              <code className="bg-slate-100 dark:bg-white/10 px-1 rounded">{"{child_name}"}</code>,{" "}
              <code className="bg-slate-100 dark:bg-white/10 px-1 rounded">{"{parent_name}"}</code>,{" "}
              <code className="bg-slate-100 dark:bg-white/10 px-1 rounded">{"{grade}"}</code> as placeholders.
            </p>
            <Field label="Subject">
              <input
                className={inputCls}
                value={settings.email_admin_subject}
                onChange={(e) => update("email_admin_subject", e.target.value)}
              />
            </Field>
          </Section>
        </>
      ) : (
        <Section title="Enrollment Form Options">
          <Field
            label="Academic Years"
            hint="Comma-separated list of years shown in the enrollment form. Use an en-dash (–) between years."
          >
            <input
              className={inputCls}
              value={settings.enrollment_academic_years}
              onChange={(e) => update("enrollment_academic_years", e.target.value)}
              placeholder="2025–2026,2026–2027"
            />
          </Field>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Example: <code className="bg-slate-100 dark:bg-white/10 px-1 rounded">2025–2026,2026–2027,2027–2028</code>
          </p>
        </Section>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>
      )}

      {settings && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">✓ Saved</span>}
        </div>
      )}
    </div>
  );
}
