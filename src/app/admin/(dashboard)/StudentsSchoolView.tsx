import { Enrollment } from "@/lib/types";

const GRADES = [
  { key: "Toddler (18–30 months)",   label: "Toddler",   color: "blue"    },
  { key: "Nursery (30–42 months)",   label: "Nursery",   color: "violet"  },
  { key: "Reception (42–54 months)", label: "Reception", color: "emerald" },
  { key: "Pre-KG (54–72 months)",    label: "Pre-KG",    color: "amber"   },
];

const GRADE_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
  blue:    { ring: "ring-blue-200 dark:ring-blue-500/30",     bg: "bg-blue-50 dark:bg-blue-500/10",     text: "text-blue-700 dark:text-blue-300"    },
  violet:  { ring: "ring-violet-200 dark:ring-violet-500/30", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-300" },
  emerald: { ring: "ring-emerald-200 dark:ring-emerald-500/30",bg:"bg-emerald-50 dark:bg-emerald-500/10",text:"text-emerald-700 dark:text-emerald-300"},
  amber:   { ring: "ring-amber-200 dark:ring-amber-500/30",   bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-700 dark:text-amber-300"   },
};

function gradeColorFor(gradeKey: string) {
  const grade = GRADES.find((g) => g.key === gradeKey);
  return grade ? GRADE_COLORS[grade.color] : GRADE_COLORS.blue;
}

function gradeLabel(gradeKey: string) {
  return GRADES.find((g) => g.key === gradeKey)?.label ?? gradeKey;
}

export default function StudentsSchoolView({ enrollments }: { enrollments: Enrollment[] }) {
  const accepted = enrollments.filter((e) => e.status === "accepted");

  const countsByGrade = GRADES.map(({ key, label, color }) => ({
    key,
    label,
    color,
    count: accepted.filter((e) => e.applying_for_grade === key).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Students</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {countsByGrade.map(({ key, label, color, count }) => {
          const c = GRADE_COLORS[color];
          return (
            <div key={key} className={`glass-card p-4 ring-1 ${c.ring} flex flex-col items-center gap-1`}>
              <span className={`text-2xl font-bold ${c.text}`}>{count}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-white">{accepted.length}</span> accepted student{accepted.length !== 1 ? "s" : ""} total
      </p>

      {/* Student cards */}
      {accepted.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">No accepted students yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accepted.map((s) => {
            const c = gradeColorFor(s.applying_for_grade);
            const initials =
              (s.child_first_name?.[0] ?? "").toUpperCase() +
              (s.child_last_name?.[0] ?? "").toUpperCase();
            return (
              <div key={s.id} className="glass-card p-5 flex flex-col gap-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {s.child_first_name} {s.child_last_name}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
                      {gradeLabel(s.applying_for_grade)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{s.child_date_of_birth}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8L3 21" />
                    </svg>
                    <span>{s.child_nationality}</span>
                  </div>
                  {s.languages_spoken && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="truncate">{s.languages_spoken}</span>
                    </div>
                  )}
                </div>

                {/* Parent info */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/8">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Parent</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{s.parent1_full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.parent1_phone}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
