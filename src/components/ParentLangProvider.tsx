"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { parentTranslations, type ParentLang, type ParentT } from "@/lib/i18n/parent";

type ParentLangCtx = { lang: ParentLang; t: ParentT; setLang: (l: ParentLang) => void };

const ParentLangContext = createContext<ParentLangCtx>({
  lang: "en",
  t: parentTranslations.en,
  setLang: () => {},
});

export function ParentLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<ParentLang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("parent_lang") as ParentLang | null;
    const valid: ParentLang[] = ["en", "lo", "zh", "ko", "th"];
    if (stored && valid.includes(stored)) setLangState(stored);
  }, []);

  function setLang(l: ParentLang) {
    setLangState(l);
    localStorage.setItem("parent_lang", l);
  }

  return (
    <ParentLangContext.Provider value={{ lang, t: parentTranslations[lang], setLang }}>
      {children}
    </ParentLangContext.Provider>
  );
}

export function useParentLang() {
  return useContext(ParentLangContext);
}
