"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { adminTranslations, type AdminLang, type AdminT } from "@/lib/i18n/admin";

type AdminLangCtx = { lang: AdminLang; t: AdminT; setLang: (l: AdminLang) => void };

const AdminLangContext = createContext<AdminLangCtx>({
  lang: "en",
  t: adminTranslations.en,
  setLang: () => {},
});

export function AdminLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("admin_lang") as AdminLang | null;
    if (stored === "en" || stored === "lo") setLangState(stored);
  }, []);

  function setLang(l: AdminLang) {
    setLangState(l);
    localStorage.setItem("admin_lang", l);
  }

  return (
    <AdminLangContext.Provider value={{ lang, t: adminTranslations[lang], setLang }}>
      {children}
    </AdminLangContext.Provider>
  );
}

export function useAdminLang() {
  return useContext(AdminLangContext);
}
