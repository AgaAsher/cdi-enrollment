import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { TranscriptStudent, TranscriptCourse } from "@/lib/types";
import {
  GRADE_SCALE,
  calculateGpa,
  gpaToQualification,
  derivedFinal,
  scoreToGpa,
} from "@/lib/transcript-gpa";
import PrintButton from "@/app/admin/(print)/[id]/print/PrintButton";

const NAVY = "#1a3456";
const GOLD = "#c9a84c";
const DARK = "#1e2640";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const WHITE = "#ffffff";

function gpaBgColor(gpa: number): string {
  if (gpa >= 3.5) return "#d1fae5";
  if (gpa >= 2.5) return "#dbeafe";
  if (gpa >= 1.5) return "#fef3c7";
  return "#fee2e2";
}
function gpaTextColor(gpa: number): string {
  if (gpa >= 3.5) return "#065f46";
  if (gpa >= 2.5) return "#1e40af";
  if (gpa >= 1.5) return "#92400e";
  return "#991b1b";
}

export default async function TranscriptPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: studentData } = await supabase
    .from("transcript_students")
    .select("*")
    .eq("id", id)
    .single();

  if (!studentData) notFound();

  const student = studentData as TranscriptStudent;

  const { data: coursesData } = await supabase
    .from("transcript_courses")
    .select("*")
    .eq("student_id", id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  const courses = (coursesData ?? []) as TranscriptCourse[];
  const overallGpa = calculateGpa(courses);

  const generated = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; background: #f1f5f9; }
        @media print { body { background: white; } }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 10, background: NAVY, padding: "10px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <PrintButton backUrl={`/admin/transcript/${id}`} />
      </div>

      {/* Document */}
      <div style={{ maxWidth: "794px", margin: "24px auto 48px", background: WHITE, boxShadow: "0 4px 24px rgba(0,0,0,0.15)", borderRadius: "6px", overflow: "hidden" }}>

        {/* ── Navy header band ── */}
        <div style={{ background: NAVY, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CDA" style={{ width: 52, height: 52, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: WHITE, letterSpacing: "-0.01em" }}>Child Development Academy</div>
              <div style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>International School of Laos · Vientiane, Laos PDR</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: WHITE, letterSpacing: "0.04em", textTransform: "uppercase" }}>Academic Report</div>
            <div style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>Generated {generated}</div>
          </div>
        </div>

        {/* ── Gold accent bar ── */}
        <div style={{ height: "4px", background: GOLD }} />

        {/* ── Body ── */}
        <div style={{ padding: "20px 24px" }}>

          {/* ── Student info card ── */}
          <div style={{ border: `1px solid ${LINE}`, borderRadius: "6px", padding: "14px 16px", marginBottom: "18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: DARK }}>{student.name}</div>
              <div style={{ display: "flex", gap: "20px", marginTop: "8px", flexWrap: "wrap" }}>
                {[
                  ["Student No", student.student_no || "—"],
                  ["Year Group", student.year_group || "—"],
                  ["Academic Year", student.academic_year || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: "8px", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: DARK, marginTop: "2px" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            {overallGpa !== null && (
              <div style={{
                background: gpaBgColor(overallGpa),
                color: gpaTextColor(overallGpa),
                padding: "10px 16px",
                borderRadius: "8px",
                textAlign: "center",
                minWidth: "90px",
              }}>
                <div style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>{overallGpa.toFixed(2)}</div>
                <div style={{ fontSize: "9px", fontWeight: 700, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Overall GPA</div>
                <div style={{ fontSize: "9px", marginTop: "2px" }}>{gpaToQualification(overallGpa)}</div>
              </div>
            )}
          </div>

          {/* ── Courses table ── */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ background: NAVY, color: WHITE, padding: "5px 10px", fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.08em", borderRadius: "4px 4px 0 0" }}>
              ACADEMIC PERFORMANCE
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${LINE}`, borderTop: "none", fontSize: "10px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: `1px solid ${LINE}` }}>
                  {["Subject", "Hrs/Wk", "Term 1", "Term 2", "Final Grade", "GPA", "Qualification"].map((h) => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: h === "Subject" ? "left" : "center", fontSize: "8px", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", borderRight: `1px solid ${LINE}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((c, idx) => {
                  const grade = derivedFinal(c);
                  const gpaPoints = grade !== null ? scoreToGpa(grade) : null;
                  const qual = gpaPoints !== null ? gpaToQualification(gpaPoints) : "—";
                  const isLast = idx === courses.length - 1;
                  return (
                    <tr key={c.id} style={{ borderBottom: isLast ? "none" : `1px solid ${LINE}`, background: idx % 2 === 0 ? WHITE : "#fafafa" }}>
                      <td style={{ padding: "5px 10px", fontWeight: 600, color: DARK, borderRight: `1px solid ${LINE}` }}>{c.name}</td>
                      <td style={{ padding: "5px 10px", textAlign: "center", color: DARK, borderRight: `1px solid ${LINE}` }}>{c.teaching_hours}</td>
                      <td style={{ padding: "5px 10px", textAlign: "center", color: DARK, borderRight: `1px solid ${LINE}` }}>{c.half_year_avg !== null ? c.half_year_avg.toFixed(1) : "—"}</td>
                      <td style={{ padding: "5px 10px", textAlign: "center", color: DARK, borderRight: `1px solid ${LINE}` }}>{c.final_avg !== null ? c.final_avg.toFixed(1) : "—"}</td>
                      <td style={{ padding: "5px 10px", textAlign: "center", fontWeight: 700, color: DARK, borderRight: `1px solid ${LINE}` }}>{grade !== null ? grade.toFixed(1) : "—"}</td>
                      <td style={{ padding: "5px 10px", textAlign: "center", borderRight: `1px solid ${LINE}` }}>
                        {gpaPoints !== null ? (
                          <span style={{ display: "inline-block", padding: "1px 7px", borderRadius: "10px", fontSize: "9px", fontWeight: 700, background: gpaBgColor(gpaPoints), color: gpaTextColor(gpaPoints) }}>
                            {gpaPoints.toFixed(1)}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "5px 10px", textAlign: "center", color: MUTED }}>{qual}</td>
                    </tr>
                  );
                })}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "12px 10px", textAlign: "center", color: MUTED, fontStyle: "italic" }}>No courses recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Grade scale reference ── */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ background: "#f1f5f9", padding: "4px 10px", fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.08em", color: MUTED, borderRadius: "4px 4px 0 0", border: `1px solid ${LINE}`, borderBottom: "none", textTransform: "uppercase" }}>
              Grade Scale Reference
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${LINE}`, fontSize: "9px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Score Range", "GPA Points", "Qualification"].map((h) => (
                    <th key={h} style={{ padding: "4px 10px", textAlign: "center", fontWeight: 700, color: MUTED, textTransform: "uppercase", fontSize: "8px", letterSpacing: "0.04em", borderRight: `1px solid ${LINE}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GRADE_SCALE.map((entry, idx) => (
                  <tr key={entry.gpa} style={{ borderTop: `1px solid ${LINE}`, background: idx % 2 === 0 ? WHITE : "#fafafa" }}>
                    <td style={{ padding: "3px 10px", textAlign: "center", color: DARK, borderRight: `1px solid ${LINE}` }}>{entry.minScore} – {entry.maxScore}</td>
                    <td style={{ padding: "3px 10px", textAlign: "center", fontWeight: 700, borderRight: `1px solid ${LINE}` }}>
                      <span style={{ display: "inline-block", padding: "0 6px", borderRadius: "8px", background: gpaBgColor(entry.gpa), color: gpaTextColor(entry.gpa) }}>
                        {entry.gpa.toFixed(1)}
                      </span>
                    </td>
                    <td style={{ padding: "3px 10px", textAlign: "center", color: DARK }}>{entry.qualification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Signature lines ── */}
          <div style={{ display: "flex", gap: "40px", marginTop: "24px", pageBreakInside: "avoid" }}>
            {["Class Teacher Signature", "Principal / Director Signature"].map((lbl) => (
              <div key={lbl} style={{ flex: 1, textAlign: "center" }}>
                {/* Stamp circle for Principal */}
                {lbl.includes("Principal") && (
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: `2px dashed ${LINE}`, margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "7px", color: "#cbd5e1", textAlign: "center", lineHeight: 1.3 }}>SCHOOL<br/>STAMP</span>
                  </div>
                )}
                {!lbl.includes("Principal") && <div style={{ height: "60px" }} />}
                <div style={{ height: "1px", background: DARK, marginBottom: "4px" }} />
                <div style={{ fontSize: "8.5px", color: MUTED }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: "16px", paddingTop: "8px", borderTop: `1px solid ${LINE}`, textAlign: "center", fontSize: "7.5px", color: "#94a3b8" }}>
            Child Development Academy – International School of Laos · 23 Singha Road, Vientiane, Laos PDR · Generated {generated}
          </div>

        </div>
      </div>
    </>
  );
}
