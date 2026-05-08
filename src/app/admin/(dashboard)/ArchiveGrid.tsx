import { createAdminClient } from "@/lib/supabase/admin";
import { Enrollment, EnrollmentStatus } from "@/lib/types";
import Link from "next/link";

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  pending:  "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ArchiveGrid({ enrollments }: { enrollments: Enrollment[] }) {
  const supabase = createAdminClient();

  const withPhotos = await Promise.all(
    enrollments.map(async (e) => {
      const photoUrl = e.student_3x4_path
        ? (await supabase.storage.from("enrollment-docs").createSignedUrl(e.student_3x4_path, 3600)).data?.signedUrl ?? null
        : null;
      return { ...e, photoUrl };
    })
  );

  if (withPhotos.length === 0) {
    return (
      <div className="glass-card p-16 text-center">
        <div className="w-12 h-12 bg-slate-100 dark:bg-white/8 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-sm">No deleted records.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
      {withPhotos.map((e) => (
        <div key={e.id} className="bg-white dark:bg-white/5 rounded-lg border border-red-200 dark:border-red-500/20 shadow-sm overflow-hidden">
          {/* Photo */}
          <div className="relative w-full aspect-square bg-slate-100 dark:bg-white/8 opacity-60 grayscale">
            {e.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.photoUrl} alt={e.child_first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <span className={`absolute top-1 right-1 text-[8px] font-semibold px-1 py-px rounded-full leading-tight ${STATUS_COLORS[e.status]}`}>
              {e.status}
            </span>
          </div>

          {/* Info */}
          <div className="p-1.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-[10px] leading-tight truncate">
              {e.child_first_name} {e.child_last_name}
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{e.applying_for_grade}</p>
            {e.deleted_at && (
              <p className="text-[9px] text-red-400 dark:text-red-500 truncate mt-0.5">{fmtDate(e.deleted_at)}</p>
            )}
            <div className="mt-1.5 flex flex-col gap-0.5">
              <Link href={`/admin/${e.id}/archive`}
                className="flex items-center justify-center w-full py-0.5 bg-blue-800 hover:bg-blue-900 text-white text-[9px] font-semibold rounded transition-colors">
                Preview
              </Link>
              <Link href={`/admin/${e.id}`}
                className="flex items-center justify-center w-full py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/8 dark:hover:bg-white/12 text-slate-600 dark:text-slate-300 text-[9px] font-medium rounded transition-colors">
                Profile
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
