"use client";

import Link from "next/link";

export default function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="text-blue-700 hover:text-blue-900 font-medium whitespace-nowrap"
    >
      {children}
    </Link>
  );
}
