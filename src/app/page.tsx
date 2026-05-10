"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

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
      setError("Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-[#0d1117] transition-colors duration-300">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
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
            <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white tracking-tight">Child Development Academy</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">International School of Laos</p>
          </div>

          {/* Sign-in form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2.5 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/6 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Password
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
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Enroll CTA */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/8">
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mb-3">
              New to CDA? Apply for enrolment below.
            </p>
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
              Enroll Your Child
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-5">
          © {new Date().getFullYear()} Child Development Academy · International School of Laos
        </p>
      </div>
    </div>
  );
}
