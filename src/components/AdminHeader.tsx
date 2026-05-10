"use client";

import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { useAdminLang } from "@/components/AdminLangProvider";
import { ADMIN_LANG_META, type AdminLang } from "@/lib/i18n/admin";

export default function AdminHeader() {
  const { lang, t, setLang } = useAdminLang();

  return (
    <header className="glass-dark px-6 py-4 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl shrink-0 bg-white/90 p-1 shadow-md">
          <Image src="/logo.png" alt="CDI" width={44} height={44} className="object-contain w-full h-full" />
        </div>
        <div>
          <p className="font-bold text-base leading-none tracking-tight text-white">
            Child Development Academy
          </p>
          <p className="text-white/50 text-sm mt-1">{t.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <div
          className="flex items-center gap-0.5 p-0.5 rounded-full"
          style={{
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.22)",
          }}
        >
          {(Object.keys(ADMIN_LANG_META) as AdminLang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-xs px-2 py-0.5 rounded-full transition-all font-medium ${
                lang === l
                  ? "bg-white/25 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/10"
              }`}
            >
              {ADMIN_LANG_META[l].flag} {ADMIN_LANG_META[l].label}
            </button>
          ))}
        </div>

        <ThemeToggle variant="glass" />

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-xs font-semibold text-white px-3 py-1.5 rounded-full transition-all"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            {t.signOut}
          </button>
        </form>
      </div>
    </header>
  );
}
