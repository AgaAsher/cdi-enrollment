"use client";

import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import RoleToggle from "@/components/RoleToggle";
import { useAdminLang } from "@/components/AdminLangProvider";
import { ADMIN_LANG_META, type AdminLang } from "@/lib/i18n/admin";

export default function AdminHeader({
  currentRole,
  availableRoles,
}: {
  currentRole?: string;
  availableRoles?: string[];
}) {
  const { lang, t, setLang } = useAdminLang();

  return (
    <header className="glass-dark px-6 py-4 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl shrink-0 bg-white p-1.5 shadow-md">
          <Image src="/logo.png" alt="CDI" width={56} height={56} className="object-contain w-full h-full" />
        </div>
        <div>
          <p className="font-bold text-base leading-none tracking-tight text-[#0f1f6b] dark:text-white">
            Child Development Academy
          </p>
          <p className="text-[#0f1f6b]/50 text-sm mt-1 dark:text-white/40">{t.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentRole && availableRoles && (
          <RoleToggle currentRole={currentRole} availableRoles={availableRoles} variant="dark" />
        )}
        {/* Language toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-full border border-[#0f1f6b]/15 dark:border-white/15 bg-white/40 dark:bg-white/5">
          {(Object.keys(ADMIN_LANG_META) as AdminLang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-xs px-2 py-0.5 rounded-full transition-all font-medium ${
                lang === l
                  ? "bg-[#0f1f6b] text-white dark:bg-blue-500"
                  : "text-[#0f1f6b]/60 hover:text-[#0f1f6b] dark:text-white/50 dark:hover:text-white"
              }`}
            >
              {ADMIN_LANG_META[l].flag} {ADMIN_LANG_META[l].label}
            </button>
          ))}
        </div>

        <ThemeToggle />

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-[#0f1f6b]/60 hover:text-[#0f1f6b] text-xs font-medium px-3 py-1.5 rounded-full border border-[#0f1f6b]/15 hover:border-[#0f1f6b]/30 hover:bg-[#0f1f6b]/5 transition-all dark:text-white/60 dark:hover:text-white dark:border-white/15 dark:hover:border-white/30 dark:hover:bg-white/10"
          >
            {t.signOut}
          </button>
        </form>
      </div>
    </header>
  );
}
