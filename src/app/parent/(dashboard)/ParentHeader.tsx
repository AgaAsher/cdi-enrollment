"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useParentLang } from "@/components/ParentLangProvider";
import { PARENT_LANG_META, type ParentLang } from "@/lib/i18n/parent";

export default function ParentHeader() {
  const { lang, t, setLang } = useParentLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="bg-white dark:bg-[#1a2035] border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="CDA" width={40} height={40} className="rounded-xl" />
        <div>
          <p className="font-bold text-sm text-[#0f1f6b] dark:text-white">Child Development Academy</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language picker */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border border-slate-200 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/8 transition-all"
          >
            <span className="text-base leading-none">{PARENT_LANG_META[lang].flag}</span>
            <span>{PARENT_LANG_META[lang].label}</span>
            <svg className={`w-3 h-3 transition-transform text-slate-400 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-36 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a2035] z-50">
              {(Object.keys(PARENT_LANG_META) as ParentLang[]).map(l => (
                <button
                  key={l}
                  onClick={() => { setLang(l); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                    lang === l
                      ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/8"
                  }`}
                >
                  <span className="text-base leading-none">{PARENT_LANG_META[l].flag}</span>
                  <span>{PARENT_LANG_META[l].label}</span>
                  {lang === l && (
                    <svg className="w-3 h-3 ml-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <ThemeToggle />

        <form action="/api/auth/logout" method="POST">
          <button className="text-xs text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/15 transition-all">
            {t.signOut}
          </button>
        </form>
      </div>
    </header>
  );
}
