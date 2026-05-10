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
    newToCda: "New to CDA? Apply for enrolment.",
    enrollBtn: "Enroll Your Child",
  },
  lo: {
    flag: "🇱🇦", label: "ລາວ",
    title: "ສະຖາບັນພັດທະນາເດັກ",
    subtitle: "ໂຮງຮຽນສາກົນລາວ",
    emailLabel: "ອີເມວ", passwordLabel: "ລະຫັດຜ່ານ",
    placeholder: "your@email.com",
    signIn: "ເຂົ້າສູ່ລະບົບ", signingIn: "ກຳລັງເຂົ້າສູ່ລະບົບ…",
    invalidCreds: "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ.",
    newToCda: "ໃໝ່ກັບ CDA? ສະໝັກລົງທະບຽນ.",
    enrollBtn: "ລົງທະບຽນລູກຂອງທ່ານ",
  },
  zh: {
    flag: "🇨🇳", label: "中文",
    title: "儿童发展学院",
    subtitle: "老挝国际学校",
    emailLabel: "邮箱", passwordLabel: "密码",
    placeholder: "your@email.com",
    signIn: "登录", signingIn: "登录中…",
    invalidCreds: "邮箱或密码无效。",
    newToCda: "初次来到 CDA？申请入学。",
    enrollBtn: "为孩子报名",
  },
  ko: {
    flag: "🇰🇷", label: "한국어",
    title: "아동 발달 아카데미",
    subtitle: "라오스 국제 학교",
    emailLabel: "이메일", passwordLabel: "비밀번호",
    placeholder: "your@email.com",
    signIn: "로그인", signingIn: "로그인 중…",
    invalidCreds: "이메일 또는 비밀번호가 올바르지 않습니다.",
    newToCda: "CDA가 처음이신가요? 등록 신청하세요.",
    enrollBtn: "자녀 등록하기",
  },
  th: {
    flag: "🇹🇭", label: "ไทย",
    title: "สถาบันพัฒนาการเด็ก",
    subtitle: "โรงเรียนนานาชาติลาว",
    emailLabel: "อีเมล", passwordLabel: "รหัสผ่าน",
    placeholder: "your@email.com",
    signIn: "เข้าสู่ระบบ", signingIn: "กำลังเข้าสู่ระบบ…",
    invalidCreds: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    newToCda: "ใหม่กับ CDA? สมัครเข้าเรียน",
    enrollBtn: "ลงทะเบียนบุตรหลาน",
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
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">

      {/* Background photo */}
      <Image
        src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1920&q=80"
        alt="School background"
        fill
        priority
        className="object-cover object-center"
        unoptimized
      />
      {/* Subtle dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Top bar */}
      <div className="fixed top-4 left-4 right-4 z-20 flex items-center justify-between">
        {/* Language picker */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setLangOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white backdrop-blur-md bg-white/20 border border-white/30 shadow hover:bg-white/30 transition-all"
          >
            <span className="text-base leading-none">{t.flag}</span>
            <span>{t.label}</span>
            <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {langOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-40 backdrop-blur-2xl bg-white/25 border border-white/40 rounded-2xl shadow-2xl overflow-hidden z-50">
              {(Object.keys(LANGS) as LangKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => { setLang(key); setLangOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-white transition-colors ${
                    lang === key ? "bg-white/25" : "hover:bg-white/15"
                  }`}
                >
                  <span className="text-base leading-none">{LANGS[key].flag}</span>
                  <span>{LANGS[key].label}</span>
                  {lang === key && (
                    <svg className="w-3 h-3 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <ThemeToggle />
      </div>

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-[360px]">
        <div
          className="rounded-3xl p-8 border border-white/40"
          style={{
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.16) 100%)",
            boxShadow: "0 8px 48px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          {/* Logo + title */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <div
                className="w-20 h-20 rounded-2xl p-1.5 flex items-center justify-center"
                style={{
                  backdropFilter: "blur(12px)",
                  background: "rgba(255,255,255,0.85)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                }}
              >
                <Image src="/logo.png" alt="CDA" width={68} height={68} priority className="object-contain" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-white drop-shadow tracking-tight">{t.title}</h1>
            <p className="text-white/75 text-sm mt-0.5">{t.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1.5">
                {t.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t.placeholder}
                required
                className="w-full px-4 py-2.5 text-sm text-white rounded-xl outline-none transition-all placeholder:text-white/40"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.30)",
                  backdropFilter: "blur(8px)",
                }}
                onFocus={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
                onBlur={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1.5">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 text-sm text-white rounded-xl outline-none transition-all placeholder:text-white/40"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.30)",
                  backdropFilter: "blur(8px)",
                }}
                onFocus={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
                onBlur={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-2.5 text-xs font-medium text-red-100 bg-red-500/30 border border-red-400/40">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-60 mt-1"
              style={{
                background: "linear-gradient(135deg, rgba(37,99,235,0.85) 0%, rgba(99,102,241,0.85) 100%)",
                boxShadow: "0 4px 20px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
              }}
            >
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>

          {/* Divider + Enroll */}
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.20)" }}>
            <p className="text-center text-xs text-white/60 mb-3">{t.newToCda}</p>
            <Link
              href="/enroll"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold text-white rounded-xl transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(5,150,105,0.80) 0%, rgba(16,185,129,0.80) 100%)",
                boxShadow: "0 4px 20px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t.enrollBtn}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-white/50 mt-5 drop-shadow">
          © {new Date().getFullYear()} Child Development Academy
        </p>
      </div>
    </div>
  );
}
