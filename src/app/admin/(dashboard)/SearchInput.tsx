"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SearchInput({ section, status }: { section: string; status: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("search") ?? "");
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("section", section);
      params.set("status", status);
      if (value) params.set("search", value);
      router.push(`/admin?${params.toString()}`);
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value, section, status, router]);

  return (
    <div
      className={`flex items-center gap-2.5 w-72 px-3.5 py-2.5 rounded-2xl border bg-white transition-all duration-200 ${
        focused
          ? "border-blue-400 shadow-md shadow-blue-100 ring-3 ring-blue-100"
          : "border-slate-200 shadow-sm hover:border-slate-300"
      }`}
    >
      <svg
        className={`w-4 h-4 shrink-0 transition-colors duration-200 ${focused ? "text-blue-500" : "text-slate-400"}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
      </svg>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search students…"
        className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
      />

      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="shrink-0 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
        >
          <svg className="w-2.5 h-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
