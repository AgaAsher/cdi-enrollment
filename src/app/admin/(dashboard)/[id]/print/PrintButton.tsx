"use client";

import { useRouter } from "next/navigation";

export default function PrintButton({ backUrl }: { backUrl: string }) {
  const router = useRouter();
  return (
    <div className="print:hidden flex items-center justify-center gap-3 mt-8 mb-4">
      <button
        onClick={() => router.push(backUrl)}
        className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Save as PDF / Print
      </button>
    </div>
  );
}
