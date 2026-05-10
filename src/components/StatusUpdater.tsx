"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EnrollmentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: { value: EnrollmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export default function StatusUpdater({
  id,
  currentStatus,
  currentNotes,
}: {
  id: string;
  currentStatus: EnrollmentStatus;
  currentNotes?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<EnrollmentStatus>(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/admin/enrollments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, admin_notes: notes }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
      <h2 className="font-semibold text-blue-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-white/10">
        Admin Actions
      </h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1 block">Update Status</label>
          <Select value={status} onValueChange={(v) => { if (v) setStatus(v as EnrollmentStatus); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1 block">Admin Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes about this application…"
            rows={3}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-800 hover:bg-blue-900 text-white"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        {saved && <span className="text-green-500 text-sm">Saved!</span>}
      </div>
    </div>
  );
}
