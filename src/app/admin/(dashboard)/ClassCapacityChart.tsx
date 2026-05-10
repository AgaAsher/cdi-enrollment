"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { useState, useEffect } from "react";
import { CLASS_LIMIT, type ClassData } from "./classConfig";
import { useAdminLang } from "@/components/AdminLangProvider";

export { CLASS_LIMIT, type ClassData };

function barColor(enrolled: number) {
  const left = CLASS_LIMIT - enrolled;
  if (left <= 0) return "#ef4444";
  if (left <= 3) return "#f59e0b";
  return "#3b82f6";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, dark, labels }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ClassData;
  const enrolled = isNaN(d.enrolled) ? 0 : d.enrolled;
  const slots = CLASS_LIMIT - enrolled;
  return (
    <div style={{
      background: dark ? "#1e2640" : "white",
      border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
      borderRadius: 12,
      padding: "12px 16px",
      boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.08)",
    }}>
      <p style={{ fontWeight: 700, color: dark ? "#e2e8f0" : "#1e293b", marginBottom: 6, fontSize: 14 }}>{d.fullName}</p>
      <p style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: 13 }}>
        {labels.enrolledLabel}: <strong style={{ color: dark ? "#e2e8f0" : "#1e293b" }}>{enrolled} / {CLASS_LIMIT}</strong>
      </p>
      <p style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: 13 }}>
        {slots <= 0 ? labels.classFull : `${slots} ${slots === 1 ? labels.slotAvailable : labels.slotsAvailable}`}
      </p>
      <p style={{ color: dark ? "#64748b" : "#94a3b8", fontSize: 12, marginTop: 4 }}>
        {Math.round((enrolled / CLASS_LIMIT) * 100)}% {labels.capacityUsed}
      </p>
    </div>
  );
}

export default function ClassCapacityChart({ data }: { data: ClassData[] }) {
  const { t } = useAdminLang();
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const check = () => setIsDark(el.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const gridStroke    = isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9";
  const axisColor     = isDark ? "#e2e8f0" : "#475569";
  const axisColorDim  = isDark ? "#cbd5e1" : "#64748b";
  const availableFill = isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0";
  const refStroke     = isDark ? "rgba(255,255,255,0.25)" : "#cbd5e1";
  const cursorFill    = isDark ? "rgba(255,255,255,0.03)" : "#f8fafc";

  const safeData = data.map((d) => ({
    ...d,
    enrolled: isNaN(d.enrolled) ? 0 : d.enrolled,
    available: isNaN(d.available) ? CLASS_LIMIT : d.available,
  }));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={safeData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barSize={56}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
        <XAxis
          dataKey="name" axisLine={false} tickLine={false}
          tick={{ fontSize: 13, fill: axisColor, fontWeight: 600 }}
        />
        <YAxis
          domain={[0, CLASS_LIMIT]} ticks={[0, 5, 10, 15]}
          axisLine={false} tickLine={false}
          tick={{ fontSize: 12, fill: axisColorDim, fontWeight: 500 }} width={28}
        />
        <Tooltip content={<CustomTooltip dark={isDark} labels={t} />} cursor={{ fill: cursorFill }} />
        <ReferenceLine y={CLASS_LIMIT} stroke={refStroke} strokeDasharray="4 3" />
        <Bar dataKey="enrolled" stackId="cap" radius={[0, 0, 6, 6]}>
          {safeData.map((entry, i) => (
            <Cell key={i} fill={barColor(entry.enrolled)} />
          ))}
        </Bar>
        <Bar dataKey="available" stackId="cap" fill={availableFill} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
