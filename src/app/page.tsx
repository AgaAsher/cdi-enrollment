"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const LANGS = {
  en: {
    flag: "🇺🇸", label: "English",
    title: "Child Development Academy",
    subtitle: "International School of Laos",
    emailLabel: "Email", passwordLabel: "Password",
    placeholder: "your@email.com",
    signIn: "Sign In", signingIn: "Signing in…",
    invalidCreds: "Invalid email or password.",
    newToCda: "New to CDA? Apply for enrolment below.",
    enrollBtn: "Enroll Your Child",
    footer: "Child Development Academy · International School of Laos",
  },
  lo: {
    flag: "🇱🇦", label: "ລາວ",
    title: "ສະຖາບັນພັດທະນາເດັກ",
    subtitle: "ໂຮງຮຽນສາກົນລາວ",
    emailLabel: "ອີເມວ", passwordLabel: "ລະຫັດຜ່ານ",
    placeholder: "your@email.com",
    signIn: "ເຂົ້າສູ່ລະບົບ", signingIn: "ກຳລັງເຂົ້າສູ່ລະບົບ…",
    invalidCreds: "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ.",
    newToCda: "ໃໝ່ກັບ CDA? ສະໝັກລົງທະບຽນຂ້າງລຸ່ມ.",
    enrollBtn: "ລົງທະບຽນລູກຂອງທ່ານ",
    footer: "ສະຖາບັນພັດທະນາເດັກ · ໂຮງຮຽນສາກົນລາວ",
  },
  zh: {
    flag: "🇨🇳", label: "中文",
    title: "儿童发展学院",
    subtitle: "老挝国际学校",
    emailLabel: "邮箱", passwordLabel: "密码",
    placeholder: "your@email.com",
    signIn: "登录", signingIn: "登录中…",
    invalidCreds: "邮箱或密码无效。",
    newToCda: "初次来到 CDA？请在下方申请入学。",
    enrollBtn: "为孩子报名",
    footer: "儿童发展学院 · 老挝国际学校",
  },
  ko: {
    flag: "🇰🇷", label: "한국어",
    title: "아동 발달 아카데미",
    subtitle: "라오스 국제 학교",
    emailLabel: "이메일", passwordLabel: "비밀번호",
    placeholder: "your@email.com",
    signIn: "로그인", signingIn: "로그인 중…",
    invalidCreds: "이메일 또는 비밀번호가 올바르지 않습니다.",
    newToCda: "CDA가 처음이신가요? 아래에서 등록 신청하세요.",
    enrollBtn: "자녀 등록하기",
    footer: "아동 발달 아카데미 · 라오스 국제 학교",
  },
  th: {
    flag: "🇹🇭", label: "ไทย",
    title: "สถาบันพัฒนาการเด็ก",
    subtitle: "โรงเรียนนานาชาติลาว",
    emailLabel: "อีเมล", passwordLabel: "รหัสผ่าน",
    placeholder: "your@email.com",
    signIn: "เข้าสู่ระบบ", signingIn: "กำลังเข้าสู่ระบบ…",
    invalidCreds: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    newToCda: "ใหม่กับ CDA? สมัครเข้าเรียนด้านล่าง",
    enrollBtn: "ลงทะเบียนบุตรหลาน",
    footer: "สถาบันพัฒนาการเด็ก · โรงเรียนนานาชาติลาว",
  },
} as const;

type LangKey = keyof typeof LANGS;

export default function Home() {
  const router = useRouter();
  const [lang, setLang]         = useState<LangKey>("en");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = LANGS[lang];

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(data.redirectTo ?? "/admin");
      router.refresh();
    } else {
      setError(t.invalidCreds);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-[#0d1117] transition-colors duration-300">

      {/* Top bar */}
      <div className="fixed top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Language picker */}
        <div ref={dropdownRef} className="relative pointer-events-auto">
          <button
            onClick={() => setLangOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 shadow-sm hover:border-slate-300 dark:hover:border-white/20 transition-all"
          >
            <span className="text-base leading-none">{t.flag}</span>
            <span>{t.label}</span>
            <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {langOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-40 bg-white dark:bg-[#1a2035] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
              {(Object.keys(LANGS) as LangKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => { setLang(key); setLangOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                    lang === key
                      ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="text-base leading-none">{LANGS[key].flag}</span>
                  <span>{LANGS[key].label}</span>
                  {lang === key && (
                    <svg className="w-3 h-3 ml-auto text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>

      <div className="w-full max-w-sm">
        <div
          className="bg-white dark:bg-[#1a2035] rounded-3xl p-8 shadow-xl dark:shadow-2xl border border-slate-100 dark:border-white/8"
          style={{ boxShadow: "0 8px 40px rgba(15,31,107,0.10), 0 2px 8px rgba(15,31,107,0.06)" }}
        >
          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-md p-1.5 flex items-center justify-center">
                <Image src="/logo.png" alt="CDA" width={72} height={72} priority className="object-contain" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white tracking-tight">{t.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t.subtitle}</p>
          </div>

          {/* Sign-in form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                {t.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t.placeholder}
                required
                className="w-full px-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #1a3fa8 0%, #2563eb 100%)",
                boxShadow: "0 4px 16px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>

          {/* Enroll CTA */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/8">
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-3">{t.newToCda}</p>
            <Link
              href="/enroll"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: "0 4px 16px rgba(16,185,129,0.40), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t.enrollBtn}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-5">
          © {new Date().getFullYear()} {t.footer}
        </p>
      </div>
    </div>
  );
}
