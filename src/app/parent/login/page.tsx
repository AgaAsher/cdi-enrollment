"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

export default function ParentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.SyntheticEvent) {
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
      router.push(data.redirectTo ?? "/parent");
      router.refresh();
    } else {
      setError("Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-[#0d1117] transition-colors duration-300">
      {/* Theme toggle — top right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Card */}
        <div
          className="bg-white dark:bg-[#1a2035] rounded-3xl p-8 shadow-xl dark:shadow-2xl border border-slate-100 dark:border-white/8"
          style={{ boxShadow: "0 8px 40px rgba(15,31,107,0.10), 0 2px 8px rgba(15,31,107,0.06)" }}
        >
          {/* Logo + title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-md p-2 flex items-center justify-center">
                <Image src="/logo.png" alt="CDA" width={88} height={88} priority className="object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#0f1f6b] dark:text-white tracking-tight">Sign In</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">CDA — Parent Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5 block">
                Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                required
              />
            </div>

            <div>
              <Label className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5 block">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-5 text-sm mt-1"
              style={{
                background: "linear-gradient(135deg, #1a3fa8 0%, #2563eb 100%)",
                boxShadow: "0 4px 16px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                border: "none",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
