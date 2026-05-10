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

/* ─── Glass token ─────────────────────────────────────────────────────────── */
const glass = {
  card: {
    backdropFilter: "blur(56px) saturate(200%) brightness(1.15)",
    WebkitBackdropFilter: "blur(56px) saturate(200%) brightness(1.15)",
    background:
      "linear-gradient(145deg, rgba(80,160,255,0.18) 0%, rgba(20,60,180,0.14) 40%, rgba(0,180,255,0.10) 100%)",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow:
      "inset 0 1.5px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,30,0.55), 0 8px 24px rgba(0,0,0,0.35)",
  },
  input: {
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.22)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30)",
  },
  inputFocus: {
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(140,200,255,0.55)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 3px rgba(80,160,255,0.20)",
  },
  btnBlue: {
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    background: "linear-gradient(135deg, rgba(37,99,235,0.90) 0%, rgba(99,102,241,0.85) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 24px rgba(37,99,235,0.50)",
  },
  btnGreen: {
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    background: "linear-gradient(135deg, rgba(5,150,105,0.88) 0%, rgba(16,185,129,0.85) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 24px rgba(16,185,129,0.45)",
  },
  langBtn: {
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40), 0 4px 16px rgba(0,0,0,0.25)",
  },
  dropdown: {
    backdropFilter: "blur(40px) saturate(200%)",
    WebkitBackdropFilter: "blur(40px) saturate(200%)",
    background: "linear-gradient(145deg, rgba(30,80,200,0.30) 0%, rgba(10,30,120,0.28) 100%)",
    border: "1px solid rgba(255,255,255,0.25)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.40), 0 16px 48px rgba(0,0,0,0.45)",
  },
};

export default function Home() {
  const router = useRouter();
  const [lang, setLang]         = useState<LangKey>("en");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [emailFocus, setEmailFocus]       = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
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

      {/* ── Background image – blurred at source ───────────────────────────── */}
      <div className="absolute inset-0 scale-110">
        <Image
          src="/bg.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          style={{ filter: "blur(10px)" }}
        />
      </div>
      {/* Extra depth overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(0,50,30,0.52) 0%, rgba(5,25,45,0.44) 50%, rgba(0,70,50,0.50) 100%)",
        }}
      />

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="fixed top-4 left-4 right-4 z-20 flex items-center justify-between">
        {/* Language picker */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setLangOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all"
            style={glass.langBtn}
          >
            <span className="text-base leading-none">{t.flag}</span>
            <span>{t.label}</span>
            <svg className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {langOpen && (
            <div className="absolute top-full left-0 mt-2 w-44 rounded-2xl overflow-hidden z-50" style={glass.dropdown}>
              {(Object.keys(LANGS) as LangKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => { setLang(key); setLangOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-white transition-colors"
                  style={lang === key ? { background: "rgba(255,255,255,0.18)" } : undefined}
                  onMouseEnter={e => { if (lang !== key) e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
                  onMouseLeave={e => { if (lang !== key) e.currentTarget.style.background = ""; }}
                >
                  <span className="text-base leading-none">{LANGS[key].flag}</span>
                  <span>{LANGS[key].label}</span>
                  {lang === key && (
                    <svg className="w-3 h-3 ml-auto text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* ── Glass card ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-[360px]">
        <div className="rounded-3xl p-8" style={glass.card}>

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <div
                className="w-20 h-20 rounded-2xl p-1.5 flex items-center justify-center"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 4px 24px rgba(0,0,80,0.30), inset 0 1px 0 rgba(255,255,255,1)",
                }}
              >
                <Image src="/logo.png" alt="CDA" width={68} height={68} priority className="object-contain" />
              </div>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight" style={{ textShadow: "0 1px 8px rgba(0,0,80,0.4)" }}>
              {t.title}
            </h1>
            <p className="text-blue-100/80 text-sm mt-0.5">{t.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-100/70 mb-1.5">
                {t.emailLabel}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                placeholder={t.placeholder}
                required
                className="w-full px-4 py-2.5 text-sm text-white rounded-xl outline-none transition-all placeholder:text-white/35"
                style={emailFocus ? glass.inputFocus : glass.input}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-100/70 mb-1.5">
                {t.passwordLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 text-sm text-white rounded-xl outline-none transition-all placeholder:text-white/35"
                style={passwordFocus ? glass.inputFocus : glass.input}
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-2.5 text-xs font-medium text-red-100"
                style={{ background: "rgba(239,68,68,0.28)", border: "1px solid rgba(239,68,68,0.45)" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 text-sm font-bold text-white rounded-xl transition-opacity disabled:opacity-60"
              style={glass.btnBlue}
            >
              {loading ? t.signingIn : t.signIn}
            </button>
          </form>

          {/* Enroll */}
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.16)" }}>
            <p className="text-center text-xs text-blue-100/55 mb-3">{t.newToCda}</p>
            <Link
              href="/enroll"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold text-white rounded-xl transition-opacity"
              style={glass.btnGreen}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t.enrollBtn}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-white/35 mt-5" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          © {new Date().getFullYear()} Child Development Academy
        </p>
      </div>
    </div>
  );
}
