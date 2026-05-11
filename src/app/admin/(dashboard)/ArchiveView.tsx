"use client";

import { useAdminLang } from "@/components/AdminLangProvider";
import { type Enrollment } from "@/lib/types";
import ArchiveGrid from "./ArchiveGrid";

type EnrollmentWithPhoto = Enrollment & { photoUrl: string | null };

export default function ArchiveView({ enrollments }: { enrollments: EnrollmentWithPhoto[] }) {
  const { t } = useAdminLang();
  const n = enrollments.length;
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">{t.archive}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.deletedRecordsDesc}</p>
        </div>
        <span className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-sm font-semibold px-3 py-1 rounded-full">
          {n} {n !== 1 ? t.records : t.record}
        </span>
      </div>
      <ArchiveGrid enrollments={enrollments} />
    </div>
  );
}
