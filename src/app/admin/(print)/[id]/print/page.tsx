import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Enrollment } from "@/lib/types";
import SafeImage from "./SafeImage";
import PrintButton from "./PrintButton";

const STATUS_LABELS: Record<string, string> = {
  pending:  "Pending Review",
  reviewed: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  accepted: { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  rejected: { bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
  reviewed: { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
  pending:  { bg: "#fefce8", color: "#854d0e", border: "#fde047" },
};

const NAVY  = "#1e3a8a";
const DARK  = "#1e293b";
const MUTED = "#64748b";
const LINE  = "#e2e8f0";

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "14px", pageBreakInside: "avoid" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        background: NAVY, color: "#fff",
        padding: "5px 10px", borderRadius: "4px 4px 0 0",
        fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.08em",
      }}>
        {title.toUpperCase()}
      </div>
      <div style={{ border: `1px solid ${LINE}`, borderTop: "none", borderRadius: "0 0 4px 4px", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, always, last }: { label: string; value?: string | null; always?: boolean; last?: boolean }) {
  if (!always && !value) return null;
  return (
    <div style={{
      display: "flex",
      borderBottom: last ? "none" : `1px solid ${LINE}`,
      fontSize: "10px",
    }}>
      <div style={{ width: "155px", flexShrink: 0, padding: "4px 10px", color: MUTED, background: "#f8fafc", borderRight: `1px solid ${LINE}`, fontSize: "9.5px" }}>
        {label}
      </div>
      <div style={{ flex: 1, padding: "4px 10px", color: DARK, fontWeight: 500 }}>
        {value || "—"}
      </div>
    </div>
  );
}

function ConsentRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  const given = value === "given";
  return (
    <div style={{ display: "flex", borderBottom: last ? "none" : `1px solid ${LINE}`, fontSize: "10px" }}>
      <div style={{ width: "155px", flexShrink: 0, padding: "4px 10px", color: MUTED, background: "#f8fafc", borderRight: `1px solid ${LINE}`, fontSize: "9.5px" }}>
        {label}
      </div>
      <div style={{ flex: 1, padding: "4px 10px", fontWeight: 600, color: given ? "#15803d" : "#b91c1c" }}>
        {given ? "✓  Consent Given" : "✗  Consent Not Given"}
      </div>
    </div>
  );
}

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("enrollments").select("*").eq("id", id).single();
  if (!data) notFound();
  const e = data as Enrollment;

  const url = async (path?: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("enrollment-docs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const [student3x4Url, studentPhotoUrl, parentPhotoUrl] = await Promise.all([
    url(e.student_3x4_path),
    url(e.student_photo_path),
    url(e.parent_photo_path),
  ]);

  const pickupUrls = await Promise.all(
    e.pickup_persons.map(async (p) => ({
      photo3x4: await url(p.photo_3x4_path),
      photoId:  await url(p.photo_id_path),
    }))
  );

  const submitted = new Date(e.created_at).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const sc = STATUS_STYLE[e.status] ?? STATUS_STYLE.pending;
  const imgBox = (w: number, h: number): React.CSSProperties => ({
    width: w, height: h, objectFit: "cover", borderRadius: "3px",
    border: `1px solid ${LINE}`, display: "block",
  });

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 14mm 14mm 12mm 14mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          background: #f1f5f9;
          color: ${DARK};
        }
        @media print { body { background: white; } }
      `}</style>

      {/* Screen: centred card look; Print: just the white content */}
      <div className="no-print" style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "32px", paddingBottom: "48px" }}>
        <PrintButton backUrl={`/admin/${e.id}`} />
      </div>

      {/* ── Document ─────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: "210mm", margin: "0 auto", background: "white",
        padding: "0",
        // On screen, render as a floating card
        position: "fixed", top: "80px", left: "50%", transform: "translateX(-50%)",
        width: "calc(100vw - 32px)", maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        borderRadius: "8px",
      }}>

        {/* Print-only styles override the fixed positioning */}
        <style>{`
          @media print {
            div[style*="position: fixed"] {
              position: static !important;
              transform: none !important;
              width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
          }
        `}</style>

        <div style={{ padding: "20px 22px" }}>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", marginBottom: "16px", borderBottom: `3px solid ${NAVY}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="CDA" style={{ width: 56, height: 56, objectFit: "contain" }} />
              <div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: NAVY, letterSpacing: "-0.02em" }}>Child Development Academy</div>
                <div style={{ fontSize: "10px", color: MUTED, marginTop: "2px" }}>International School of Laos · Vientiane, Laos PDR</div>
                <div style={{ fontSize: "9px", color: MUTED }}>Enrollment Application · Submitted {submitted}</div>
              </div>
            </div>
            <div style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
              background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
            }}>
              {STATUS_LABELS[e.status] ?? e.status}
            </div>
          </div>

          {/* ── Student banner ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: DARK, letterSpacing: "-0.03em" }}>
                {e.child_first_name} {e.child_last_name}
              </div>
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "3px" }}>
                {e.applying_for_grade} &nbsp;·&nbsp; Academic Year {e.academic_year}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              {student3x4Url   && <SafeImage src={student3x4Url}   alt="3×4 photo"    style={imgBox(62, 78)} label="3×4 Photo" />}
              {studentPhotoUrl && <SafeImage src={studentPhotoUrl} alt="Student photo" style={imgBox(62, 78)} label="Student Photo" />}
            </div>
          </div>

          {/* ── Child Info ──────────────────────────────────────────────────── */}
          <Sec title="Child Information">
            <Row label="Full Name"       value={`${e.child_first_name} ${e.child_last_name}`} />
            <Row label="Date of Birth"   value={e.child_date_of_birth} />
            <Row label="Gender"          value={e.child_gender} />
            <Row label="Nationality"     value={e.child_nationality} />
            <Row label="Grade Applied"   value={e.applying_for_grade} />
            <Row label="Academic Year"   value={e.academic_year} />
            <Row label="Previous School" value={e.previous_school} />
            <Row label="Languages"       value={e.languages_spoken} last />
          </Sec>

          {/* ── Parent 1 ────────────────────────────────────────────────────── */}
          <Sec title="Parent / Guardian 1">
            <div style={{ display: "flex" }}>
              <div style={{ flex: 1 }}>
                <Row label="Full Name"    value={e.parent1_full_name} />
                <Row label="Relationship" value={e.parent1_relationship} />
                <Row label="Phone"        value={e.parent1_phone} />
                <Row label="Email"        value={e.parent1_email} />
                <Row label="Occupation"   value={e.parent1_occupation} last />
              </div>
              {parentPhotoUrl && (
                <div style={{ padding: "8px", borderLeft: `1px solid ${LINE}`, background: "#f8fafc", display: "flex", alignItems: "center" }}>
                  <SafeImage src={parentPhotoUrl} alt="Parent photo" style={imgBox(56, 70)} label="Parent Photo" />
                </div>
              )}
            </div>
          </Sec>

          {/* ── Parent 2 ────────────────────────────────────────────────────── */}
          {e.parent2_full_name && (
            <Sec title="Parent / Guardian 2">
              <Row label="Full Name"    value={e.parent2_full_name} />
              <Row label="Relationship" value={e.parent2_relationship} />
              <Row label="Phone"        value={e.parent2_phone} />
              <Row label="Email"        value={e.parent2_email} last />
            </Sec>
          )}

          {/* ── Home Address ────────────────────────────────────────────────── */}
          <Sec title="Home Address">
            <Row label="Street / Village" value={e.home_address} />
            <Row label="City / District"  value={e.city} last />
          </Sec>

          {/* ── Medical & Emergency ─────────────────────────────────────────── */}
          <Sec title="Medical &amp; Emergency">
            <Row label="Medical Conditions" value={e.medical_conditions} always />
            <Row label="Allergies"          value={e.allergies} always />
            <Row label="Emergency Contact"  value={e.emergency_contact_name} />
            <Row label="Emergency Phone"    value={e.emergency_contact_phone} />
            <Row label="Relationship"       value={e.emergency_contact_relationship} last />
          </Sec>

          {/* ── Authorized Pickup ───────────────────────────────────────────── */}
          {e.pickup_persons?.length > 0 && (
            <Sec title="Authorized to Pick Up Child">
              {e.pickup_persons.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: "10px", alignItems: "flex-start",
                    borderBottom: i < e.pickup_persons.length - 1 ? `1px solid ${LINE}` : "none",
                    padding: "8px 10px",
                    pageBreakInside: "avoid",
                  }}
                >
                  {(pickupUrls[i].photo3x4 || pickupUrls[i].photoId) && (
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      {pickupUrls[i].photo3x4 && <SafeImage src={pickupUrls[i].photo3x4!} alt="3×4"      style={imgBox(48, 60)} label="3×4" />}
                      {pickupUrls[i].photoId  && <SafeImage src={pickupUrls[i].photoId!}  alt="ID photo" style={imgBox(48, 60)} label="ID" />}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: NAVY, letterSpacing: "0.05em", marginBottom: "4px" }}>PERSON {i + 1}</div>
                    <Row label="Name"         value={p.name} />
                    <Row label="Relationship" value={p.relationship} />
                    <Row label="Phone"        value={p.phone} />
                    {p.email && <Row label="Email" value={p.email} last />}
                  </div>
                </div>
              ))}
            </Sec>
          )}

          {/* ── Consent ─────────────────────────────────────────────────────── */}
          <Sec title="Photo &amp; Marketing Consent">
            <ConsentRow label="Social Media"     value={e.consent_social_media} />
            <ConsentRow label="Posters &amp; Ads" value={e.consent_marketing} last />
          </Sec>

          {/* ── School Visit ────────────────────────────────────────────────── */}
          {e.visit_date && (
            <Sec title="School Visit Request">
              <Row label="Preferred Date" value={e.visit_date} />
              <Row label="Preferred Time" value={e.visit_time} last />
            </Sec>
          )}

          {/* ── Admin Notes ─────────────────────────────────────────────────── */}
          {e.admin_notes && (
            <Sec title="Admin Notes">
              <div style={{ padding: "8px 10px", fontSize: "10px", color: DARK, whiteSpace: "pre-wrap" }}>{e.admin_notes}</div>
            </Sec>
          )}

          {/* ── Signatures ──────────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: "40px", marginTop: "28px", pageBreakInside: "avoid" }}>
            {["Parent / Guardian Signature", "School Authorized Signature"].map((lbl) => (
              <div key={lbl} style={{ flex: 1 }}>
                <div style={{ height: "36px", borderBottom: `1.5px solid ${DARK}` }} />
                <div style={{ fontSize: "9px", color: MUTED, marginTop: "4px" }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div style={{ marginTop: "14px", paddingTop: "8px", borderTop: `1px solid ${LINE}`, textAlign: "center", fontSize: "8px", color: "#94a3b8" }}>
            Child Development Academy – International School of Laos · Vientiane, Laos PDR
            &nbsp;·&nbsp; Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </div>

        </div>
      </div>
    </>
  );
}
