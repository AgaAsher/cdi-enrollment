import EnrollmentForm from "@/components/EnrollmentForm";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#0d1117] transition-colors duration-300">
      {/* Top bar */}
      <div className="flex justify-end items-center gap-3 px-5 py-3">
        <ThemeToggle />
        <Link
          href="/admin/login"
          className="text-xs font-medium text-slate-500 dark:text-white/50 hover:text-[#0f1f6b] dark:hover:text-white px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm"
        >
          Admin Login
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-36 h-36 rounded-3xl bg-white shadow-lg p-2 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Child Development Academy"
                width={128}
                height={128}
                priority
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0f1f6b] dark:text-white tracking-tight">Child Development Academy</h1>
          <p className="text-[#1a3fa8] dark:text-blue-400 text-lg mt-1">International School of Laos</p>
          <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Complete the form below to begin your child&apos;s enrollment application.
            Our admissions team will review and respond within 3–5 business days.
          </p>
        </div>

        <EnrollmentForm />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 text-sm text-slate-500 dark:text-slate-500">
          <span>Questions? Contact us:</span>
          <a href="mailto:info.cda@isl.edu.la" className="text-blue-600 dark:text-blue-400 underline">
            info.cda@isl.edu.la
          </a>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">·</span>
          <a
            href="https://wa.me/85620577787111"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 underline"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            +856 20 57 778 711
          </a>
        </div>
      </div>
    </main>
  );
}
