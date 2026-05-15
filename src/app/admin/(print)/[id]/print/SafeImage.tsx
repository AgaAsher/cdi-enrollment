"use client";

import { useState } from "react";

export default function SafeImage({
  src,
  alt,
  style,
  label,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={style} onError={() => setFailed(true)} />
      {label && (
        <div style={{ fontSize: "8px", color: "#94a3b8", marginTop: "2px" }}>{label}</div>
      )}
    </div>
  );
}
