"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-[#0d1117]">
      <div className="max-w-md text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-red-50 dark:bg-red-500/15 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          An unexpected error occurred. Please try again, and if the problem persists, contact{" "}
          <a href="mailto:info.cda@isl.edu.la" className="text-blue-600 dark:text-blue-400 underline">
            info.cda@isl.edu.la
          </a>.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
