"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TimetableGenerator from "./TimetableGenerator";

type SlotColor = "blue" | "indigo" | "amber" | "green" | "purple" | "orange" | "pink" | "violet" | "slate";
type SlotCell  = { subject: string; teacher: string; room: string; group: string; groupLabel: string; isFixed: boolean };
type GRow      = { time: string; duration: string; color: SlotColor; cells: SlotCell[][] };
type ClassOut  = { label: string; rows: GRow[] };
type TimetableData = Record<string, ClassOut>;
type Published  = { timetable_data: TimetableData; academic_year: string; published_at: string };
type BenchItem  = { cells: SlotCell[]; color: SlotColor };
type Snapshot   = { data: TimetableData; bench: BenchItem[] };
type DragSrcFull =
  | { kind: "cell";  ri: number; di: number }
  | { kind: "bench"; idx: number };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const EMPTY_CELL: SlotCell = { subject: "", teacher: "", room: "", group: "", groupLabel: "", isFixed: false };

const SLOT_BG: Record<SlotColor, string> = {
  blue:   "bg-blue-100 dark:bg-blue-500/20",
  indigo: "bg-indigo-100 dark:bg-indigo-500/20",
  amber:  "bg-amber-100 dark:bg-amber-500/20",
  green:  "bg-emerald-100 dark:bg-emerald-500/20",
  purple: "bg-purple-100 dark:bg-purple-500/20",
  orange: "bg-orange-100 dark:bg-orange-500/20",
  pink:   "bg-pink-100 dark:bg-pink-500/20",
  violet: "bg-violet-100 dark:bg-violet-500/20",
  slate:  "bg-slate-100 dark:bg-white/6",
};
const SLOT_TEXT: Record<SlotColor, string> = {
  blue:   "text-blue-800 dark:text-blue-200",
  indigo: "text-indigo-800 dark:text-indigo-200",
  amber:  "text-amber-800 dark:text-amber-200",
  green:  "text-emerald-800 dark:text-emerald-200",
  purple: "text-purple-800 dark:text-purple-200",
  orange: "text-orange-800 dark:text-orange-200",
  pink:   "text-pink-800 dark:text-pink-200",
  violet: "text-violet-800 dark:text-violet-200",
  slate:  "text-slate-500 dark:text-slate-400",
};

function isEmpty(cells: SlotCell[]) {
  return cells.length === 0 || cells.every(c => !c.subject);
}

export default function TimetableEditor() {
  const [published, setPublished]         = useState<Published | null>(null);
  const [localData, setLocalData]         = useState<TimetableData | null>(null);
  const [bench, setBench]                 = useState<BenchItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [activeKey, setActiveKey]         = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [canUndo, setCanUndo]             = useState(false);
  const [canRedo, setCanRedo]             = useState(false);

  // drag visual state
  const [dragCell,      setDragCell]      = useState<{ ri: number; di: number } | null>(null);
  const [dragBenchIdx,  setDragBenchIdx]  = useState<number | null>(null);
  const [dropCell,      setDropCell]      = useState<{ ri: number; di: number } | null>(null);
  const [dropOnBench,   setDropOnBench]   = useState(false);

  const dragSrcRef = useRef<DragSrcFull | null>(null);
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const history    = useRef<Snapshot[]>([]);
  const historyIdx = useRef<number>(-1);

  function syncHistoryFlags() {
    setCanUndo(historyIdx.current > 0);
    setCanRedo(historyIdx.current < history.current.length - 1);
  }

  function pushHistory(data: TimetableData, b: BenchItem[]) {
    history.current = history.current.slice(0, historyIdx.current + 1);
    history.current.push({ data: JSON.parse(JSON.stringify(data)), bench: JSON.parse(JSON.stringify(b)) });
    historyIdx.current = history.current.length - 1;
    syncHistoryFlags();
  }

  const scheduleSave = useCallback((data: TimetableData, academicYear: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timetable_data: data, academic_year: academicYear }),
      });
      setSaving(false);
    }, 400);
  }, []);

  const fetchPublished = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/timetable");
      const json = await res.json();
      const data: Published | null = json.timetable ?? null;
      setPublished(data);
      const initial = data ? JSON.parse(JSON.stringify(data.timetable_data)) as TimetableData : null;
      setLocalData(initial);
      setBench([]);
      history.current    = initial ? [{ data: JSON.parse(JSON.stringify(initial)), bench: [] }] : [];
      historyIdx.current = initial ? 0 : -1;
      setCanUndo(false);
      setCanRedo(false);
      setActiveKey(prev => {
        const keys = Object.keys(data?.timetable_data ?? {});
        return prev && keys.includes(prev) ? prev : keys[0] ?? "";
      });
    } catch {
      setPublished(null);
      setLocalData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPublished(); }, [fetchPublished]);

  // keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function handleUndo() {
    if (!published || historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    const snap = history.current[historyIdx.current];
    const d = JSON.parse(JSON.stringify(snap.data)) as TimetableData;
    const b = JSON.parse(JSON.stringify(snap.bench)) as BenchItem[];
    setLocalData(d);
    setBench(b);
    scheduleSave(d, published.academic_year);
    syncHistoryFlags();
  }

  function handleRedo() {
    if (!published || historyIdx.current >= history.current.length - 1) return;
    historyIdx.current += 1;
    const snap = history.current[historyIdx.current];
    const d = JSON.parse(JSON.stringify(snap.data)) as TimetableData;
    const b = JSON.parse(JSON.stringify(snap.bench)) as BenchItem[];
    setLocalData(d);
    setBench(b);
    scheduleSave(d, published.academic_year);
    syncHistoryFlags();
  }

  // ── drag start ─────────────────────────────────────────────────────────────
  function onCellDragStart(e: React.DragEvent, ri: number, di: number) {
    dragSrcRef.current = { kind: "cell", ri, di };
    setDragCell({ ri, di });
    e.dataTransfer.effectAllowed = "move";
  }

  function onBenchDragStart(e: React.DragEvent, idx: number) {
    dragSrcRef.current = { kind: "bench", idx };
    setDragBenchIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    dragSrcRef.current = null;
    setDragCell(null);
    setDragBenchIdx(null);
    setDropCell(null);
    setDropOnBench(false);
  }

  // ── drop on grid cell ──────────────────────────────────────────────────────
  function onCellDrop(e: React.DragEvent, dstRi: number, dstDi: number) {
    e.preventDefault();
    const src = dragSrcRef.current;
    if (!src || !localData || !activeKey || !published) return onDragEnd();

    const next  = JSON.parse(JSON.stringify(localData)) as TimetableData;
    const rows  = next[activeKey].rows;
    const nextB = JSON.parse(JSON.stringify(bench)) as BenchItem[];

    if (src.kind === "cell") {
      if (src.ri === dstRi && src.di === dstDi) return onDragEnd();
      // swap grid ↔ grid
      const tmp = rows[src.ri].cells[src.di];
      rows[src.ri].cells[src.di] = rows[dstRi].cells[dstDi];
      rows[dstRi].cells[dstDi]   = tmp;
    } else {
      // bench → grid: place bench item into slot; if slot non-empty, push to bench
      const item = nextB[src.idx];
      const displaced = rows[dstRi].cells[dstDi];
      rows[dstRi].cells[dstDi] = item.cells;
      if (!isEmpty(displaced)) {
        nextB.splice(src.idx, 1, { cells: displaced, color: rows[dstRi].color });
      } else {
        nextB.splice(src.idx, 1);
      }
    }

    pushHistory(next, nextB);
    setLocalData(next);
    setBench(nextB);
    scheduleSave(next, published.academic_year);
    onDragEnd();
  }

  // ── drop on bench ──────────────────────────────────────────────────────────
  function onBenchDrop(e: React.DragEvent) {
    e.preventDefault();
    const src = dragSrcRef.current;
    if (!src || !localData || !activeKey || !published) return onDragEnd();

    const next  = JSON.parse(JSON.stringify(localData)) as TimetableData;
    const rows  = next[activeKey].rows;
    const nextB = JSON.parse(JSON.stringify(bench)) as BenchItem[];

    if (src.kind === "cell") {
      const cells = rows[src.ri].cells[src.di];
      if (!isEmpty(cells)) {
        nextB.push({ cells, color: rows[src.ri].color });
        rows[src.ri].cells[src.di] = [{ ...EMPTY_CELL }];
      }
    }
    // bench → bench (already there, no-op)

    pushHistory(next, nextB);
    setLocalData(next);
    setBench(nextB);
    scheduleSave(next, published.academic_year);
    onDragEnd();
  }

  // ── remove bench item ──────────────────────────────────────────────────────
  function removeBenchItem(idx: number) {
    if (!localData || !published) return;
    const nextB = bench.filter((_, i) => i !== idx);
    pushHistory(localData, nextB);
    setBench(nextB);
  }

  // ── download PDF ──────────────────────────────────────────────────────────
  async function downloadPDF() {
    if (!localData || !activeKey || !published) return;

    const { jsPDF }          = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc        = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const classLabel = localData[activeKey].label;

    const BG: Record<SlotColor, [number, number, number]> = {
      blue:   [219, 234, 254],
      indigo: [224, 231, 255],
      amber:  [254, 243, 199],
      green:  [209, 250, 229],
      purple: [243, 232, 255],
      orange: [255, 237, 213],
      pink:   [252, 231, 243],
      violet: [237, 233, 254],
      slate:  [241, 245, 249],
    };
    const FG: Record<SlotColor, [number, number, number]> = {
      blue:   [30,  64,  175],
      indigo: [55,  48,  163],
      amber:  [146, 64,  14 ],
      green:  [6,   95,  70 ],
      purple: [107, 33,  168],
      orange: [154, 52,  18 ],
      pink:   [157, 23,  77 ],
      violet: [91,  33,  182],
      slate:  [100, 116, 139],
    };

    // header
    doc.setFontSize(14);
    doc.setTextColor(15, 31, 107);
    doc.text(`${classLabel} — Weekly Timetable`, 14, 16);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${published.academic_year} · Generated ${new Date().toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}`, 14, 22);

    const rows = localData[activeKey].rows;

    const body = rows.map(row => {
      const timeCell = {
        content: row.time + (row.duration ? `\n${row.duration}` : ""),
        styles: { fontStyle: "bold" as const, textColor: [51, 65, 85] as [number,number,number], fillColor: [255,255,255] as [number,number,number], fontSize: 8 },
      };
      const dayCells = row.cells.map(cellArr => {
        const content = cellArr.map(c => {
          if (!c.subject) return "—";
          let t = c.subject;
          if (!c.isFixed && c.teacher) t += `\n${c.teacher.split(" ").slice(-1)[0]}`;
          if (!c.isFixed && c.room)    t += `\n${c.room}`;
          if (c.groupLabel)            t = `[${c.groupLabel}] ${t}`;
          return t;
        }).join("\n");
        return {
          content,
          styles: {
            fillColor: BG[row.color],
            textColor: FG[row.color],
            halign: "center" as const,
            fontSize: 8,
          },
        };
      });
      return [timeCell, ...dayCells];
    });

    autoTable(doc, {
      head: [["Time", ...DAYS]],
      body,
      startY: 27,
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
      headStyles: { fillColor: [15, 31, 107], textColor: [255, 255, 255], fontStyle: "bold", halign: "center", fontSize: 8 },
      columnStyles: { 0: { cellWidth: 22, halign: "left" } },
    });

    doc.save(`timetable-${classLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

  const timetable = localData;
  const allKeys   = timetable ? Object.keys(timetable) : [];

  return (
    <div className="space-y-4">
      {showGenerator && (
        <TimetableGenerator
          onClose={(wasPublished) => {
            setShowGenerator(false);
            if (wasPublished) fetchPublished();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#0f1f6b] dark:text-white">Timetable</h1>
          {saving && (
            <span className="flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Saving…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {published && (
            <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/8 px-3 py-1.5 rounded-full font-medium hidden sm:inline">
              {published.academic_year} · Published {new Date(published.published_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}

          {timetable && (
            <div className="flex items-center gap-0.5 border border-slate-200 dark:border-white/12 rounded-xl overflow-hidden">
              <button type="button" title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={!canUndo}
                className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-white/12" />
              <button type="button" title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={!canRedo}
                className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          )}

          <button type="button" onClick={() => setShowGenerator(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            Generate
          </button>
          {timetable && (
            <button type="button" onClick={downloadPDF}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/12 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/25 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              PDF
            </button>
          )}
          <button type="button" onClick={fetchPublished}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/12 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/25 transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !timetable ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 bg-slate-100 dark:bg-white/8 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No timetable published yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Use Generate to create and publish a timetable.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Class tabs */}
          {allKeys.length > 1 && (
            <div className="flex items-center gap-1 flex-wrap">
              {allKeys.map(key => (
                <button key={key} type="button" onClick={() => setActiveKey(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeKey === key
                      ? "bg-[#0f1f6b] text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-[#0f1f6b] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8"
                  }`}>
                  {timetable[key].label}
                </button>
              ))}
            </div>
          )}

          {/* drag hint */}
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
            Drag slots to swap, or drop them into the waiting list below to park temporarily.
          </p>

          {/* ── Waiting list / bench ─────────────────────────────────────────── */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDropOnBench(true); }}
            onDragLeave={() => setDropOnBench(false)}
            onDrop={(e) => { setDropOnBench(false); onBenchDrop(e); }}
            className={`rounded-2xl border-2 border-dashed transition-colors min-h-[68px] px-3 py-2 flex items-center gap-2 flex-wrap
              ${dropOnBench
                ? "border-blue-400 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/3"
              }`}
          >
            {bench.length === 0 ? (
              <span className="text-xs text-slate-400 dark:text-slate-500 select-none w-full text-center py-1">
                Waiting list — drag lessons here to park them
              </span>
            ) : (
              bench.map((item, idx) => {
                const isDraggingThis = dragBenchIdx === idx;
                return (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => onBenchDragStart(e, idx)}
                    onDragEnd={onDragEnd}
                    className={`group relative flex flex-col items-center justify-center rounded-xl px-3 py-1.5 cursor-grab active:cursor-grabbing transition-all
                      ${SLOT_BG[item.color]} ${SLOT_TEXT[item.color]}
                      ${isDraggingThis ? "opacity-30 scale-95" : "hover:scale-105"}
                    `}
                  >
                    {item.cells.map((cell, ci) => (
                      <div key={ci} className="text-center leading-tight">
                        {cell.groupLabel && (
                          <div className="text-[9px] font-bold opacity-60 uppercase tracking-wide">{cell.groupLabel}</div>
                        )}
                        <div className="font-semibold text-xs">{cell.subject || "—"}</div>
                        {cell.teacher && !cell.isFixed && (
                          <div className="text-[10px] opacity-70">{cell.teacher.split(" ").slice(-1)[0]}</div>
                        )}
                      </div>
                    ))}
                    {/* remove button */}
                    <button
                      type="button"
                      onClick={() => removeBenchItem(idx)}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex w-4 h-4 rounded-full bg-slate-500 dark:bg-slate-600 text-white items-center justify-center"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Grid ────────────────────────────────────────────────────────── */}
          {activeKey && timetable[activeKey] && (
            <div className="glass-card overflow-x-auto" onDragEnd={onDragEnd}>
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/8">
                    <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide w-28 opacity-70">Time</th>
                    {DAYS.map(d => (
                      <th key={d} className="px-2 py-3 font-semibold text-xs uppercase tracking-wide text-center opacity-70">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetable[activeKey].rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-slate-100 dark:border-white/6 last:border-0">
                      <td className="px-4 py-2 align-middle">
                        <p className="font-bold text-xs">{row.time}</p>
                        {row.duration && <p className="text-[10px] opacity-60 mt-0.5">{row.duration}</p>}
                      </td>
                      {row.cells.map((cellArr, di) => {
                        const isDragging = dragCell?.ri === ri && dragCell?.di === di;
                        const isTarget   = dropCell?.ri === ri && dropCell?.di === di && !isDragging;
                        const isSplit    = cellArr.length > 1;

                        return (
                          <td
                            key={di}
                            className={`px-1.5 py-1.5 transition-all ${isTarget ? "scale-[1.04] brightness-110" : ""}`}
                            draggable
                            onDragStart={(e) => onCellDragStart(e, ri, di)}
                            onDragOver={(e) => { e.preventDefault(); setDropCell({ ri, di }); }}
                            onDragLeave={() => setDropCell(null)}
                            onDrop={(e) => { setDropCell(null); onCellDrop(e, ri, di); }}
                          >
                            {isSplit ? (
                              <div className={`flex flex-col gap-0.5 rounded-xl transition-all
                                ${isDragging ? "opacity-30 scale-95" : ""}
                                ${isTarget ? "ring-2 ring-blue-400 dark:ring-blue-400 ring-offset-1" : ""}`}>
                                {cellArr.map((cell, gi) => (
                                  <div key={gi} className={`rounded-xl px-2 py-1.5 text-center flex flex-col items-center justify-center gap-0.5 cursor-grab active:cursor-grabbing ${SLOT_BG[row.color]} ${SLOT_TEXT[row.color]}`}>
                                    {cell.groupLabel && (
                                      <span className="text-[9px] font-bold opacity-60 uppercase tracking-wide leading-none">{cell.groupLabel}</span>
                                    )}
                                    <span className="font-semibold text-xs leading-tight">{cell.subject || "—"}</span>
                                    {!cell.isFixed && cell.teacher && (
                                      <span className="text-[10px] opacity-70 leading-tight">{cell.teacher.split(" ").slice(-1)[0]}</span>
                                    )}
                                    {!cell.isFixed && cell.room && (
                                      <span className="text-[10px] opacity-55 leading-tight">{cell.room}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`rounded-xl px-2 py-2 text-center min-h-[52px] flex flex-col items-center justify-center gap-0.5 transition-all cursor-grab active:cursor-grabbing
                                ${SLOT_BG[row.color]} ${SLOT_TEXT[row.color]}
                                ${isDragging ? "opacity-30 scale-95" : ""}
                                ${isTarget ? "ring-2 ring-blue-400 dark:ring-blue-400 ring-offset-1 ring-offset-transparent" : ""}
                              `}>
                                <span className="font-semibold text-xs leading-tight">{cellArr[0]?.subject || "—"}</span>
                                {!cellArr[0]?.isFixed && cellArr[0]?.teacher && (
                                  <span className="text-[10px] opacity-70 leading-tight mt-0.5">
                                    {cellArr[0].teacher.split(" ").slice(-1)[0]}
                                  </span>
                                )}
                                {!cellArr[0]?.isFixed && cellArr[0]?.room && (
                                  <span className="text-[10px] opacity-55 leading-tight">{cellArr[0].room}</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
