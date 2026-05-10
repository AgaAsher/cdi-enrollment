import EnrollmentForm from "@/components/EnrollmentForm";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Enroll – Child Development Academy",
  description: "Online enrollment registration for Child Development Academy – International School of Laos",
};

export default function EnrollPage() {
  return (
    <main className="glass-context min-h-screen relative">

      {/* ── Background — same as sign-in page ─────────────────────────────── */}
      <div className="fixed inset-0 -z-10 scale-110">
        <Image src="/bg.jpg" alt="" fill priority className="object-cover object-center" style={{ filter: "blur(10px)" }} />
      </div>
      <div className="fixed inset-0 -z-10" style={{ background: "linear-gradient(160deg, rgba(0,10,20,0.52) 0%, rgba(0,5,15,0.48) 50%, rgba(0,15,30,0.50) 100%)" }} />

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-5 py-3">
        <Link
          href="/"
          className="text-xs font-semibold text-white px-3 py-1.5 rounded-full transition-all"
          style={{
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.28)",
          }}
        >
          ← Sign In
        </Link>
        <ThemeToggle variant="glass" />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <div className="w-28 h-28 rounded-3xl bg-white/90 shadow-lg p-2 flex items-center justify-center"
                 style={{ boxShadow: "0 4px 24px rgba(0,0,80,0.30), inset 0 1px 0 rgba(255,255,255,1)" }}>
              <Image src="/logo.png" alt="Child Development Academy" width={104} height={104} priority className="object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight" style={{ textShadow: "0 1px 8px rgba(0,0,80,0.4)" }}>
            Child Development Academy
          </h1>
          <p className="text-blue-200/80 text-lg mt-1">International School of Laos</p>
        </div>

        <EnrollmentForm />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 text-sm text-white/55">
          <span>Questions? Contact us:</span>
          <a href="mailto:info.cda@isl.edu.la" className="text-blue-300 underline">
            info.cda@isl.edu.la
          </a>
          <span className="hidden sm:inline text-white/25">·</span>
          <a
            href="https://wa.me/85620577787111"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-300 underline"
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
