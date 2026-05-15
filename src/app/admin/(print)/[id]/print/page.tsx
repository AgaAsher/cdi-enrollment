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

const NAVY = "#1e3a8a";
const DARK = "#1e293b";
const MUTED = "#64748b";
const LINE = "#e2e8f0";

/* ── Compact section box ─────────────────────────────────────────────────── */
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ pageBreakInside: "avoid" }}>
      <div style={{
        background: NAVY, color: "#fff",
        padding: "3px 8px", fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.08em",
        borderRadius: "3px 3px 0 0",
      }}>
        {title.toUpperCase()}
      </div>
      <div style={{ border: `1px solid ${LINE}`, borderTop: "none", borderRadius: "0 0 3px 3px" }}>
        {children}
      </div>
    </div>
  );
}

/* ── Data row ────────────────────────────────────────────────────────────── */
function Row({ label, value, always, last }: { label: string; value?: string | null; always?: boolean; last?: boolean }) {
  if (!always && !value) return null;
  return (
    <div style={{ display: "flex", borderBottom: last ? "none" : `1px solid ${LINE}`, minHeight: "17px" }}>
      <div style={{ width: "130px", flexShrink: 0, padding: "2px 7px", color: MUTED, background: "#f8fafc", borderRight: `1px solid ${LINE}`, fontSize: "8.5px", display: "flex", alignItems: "center" }}>
        {label}
      </div>
      <div style={{ flex: 1, padding: "2px 7px", color: DARK, fontWeight: 500, fontSize: "9px", display: "flex", alignItems: "center" }}>
        {value || "—"}
      </div>
    </div>
  );
}

/* ── Consent row ─────────────────────────────────────────────────────────── */
function ConsentRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  const given = value === "given";
  return (
    <div style={{ display: "flex", borderBottom: last ? "none" : `1px solid ${LINE}`, minHeight: "17px" }}>
      <div style={{ width: "130px", flexShrink: 0, padding: "2px 7px", color: MUTED, background: "#f8fafc", borderRight: `1px solid ${LINE}`, fontSize: "8.5px", display: "flex", alignItems: "center" }}>
        {label}
      </div>
      <div style={{ flex: 1, padding: "2px 7px", fontWeight: 600, fontSize: "9px", color: given ? "#15803d" : "#b91c1c", display: "flex", alignItems: "center" }}>
        {given ? "✓ Given" : "✗ Not Given"}
      </div>
    </div>
  );
}

/* ── Two-column wrapper ──────────────────────────────────────────────────── */
function TwoCol({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {left}
      {right}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("enrollments").select("*").eq("id", id).single();
  if (!data) notFound();
  const e = data as Enrollment;

  const getUrl = async (path?: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("enrollment-docs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const [student3x4Url, studentPhotoUrl, parentPhotoUrl] = await Promise.all([
    getUrl(e.student_3x4_path),
    getUrl(e.student_photo_path),
    getUrl(e.parent_photo_path),
  ]);

  const pickupUrls = await Promise.all(
    e.pickup_persons.map(async (p) => ({
      photo3x4: await getUrl(p.photo_3x4_path),
      photoId:  await getUrl(p.photo_id_path),
    }))
  );

  const submitted = new Date(e.created_at).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const sc = STATUS_STYLE[e.status] ?? STATUS_STYLE.pending;
  const box = (w: number, h: number): React.CSSProperties => ({
    width: w, height: h, objectFit: "cover", borderRadius: "2px",
    border: `1px solid ${LINE}`, display: "block",
  });

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 11mm 11mm 10mm 11mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; background: #f1f5f9; }
        @media print { body { background: white; } }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 10, background: "#1e3a8a", padding: "10px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <PrintButton backUrl={`/admin/${e.id}`} />
      </div>

      {/* Document */}
      <div style={{ maxWidth: "794px", margin: "24px auto 48px", background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.15)", borderRadius: "6px", padding: "18px 20px" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", marginBottom: "12px", borderBottom: `3px solid ${NAVY}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CDA" style={{ width: 48, height: 48, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: NAVY }}>Child Development Academy</div>
              <div style={{ fontSize: "9px", color: MUTED }}>International School of Laos · Vientiane, Laos PDR</div>
              <div style={{ fontSize: "9px", color: MUTED }}>Enrollment Application · Submitted {submitted}</div>
            </div>
          </div>
          <div style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
            {STATUS_LABELS[e.status] ?? e.status}
          </div>
        </div>

        {/* ── Student name + photos ───────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "19px", fontWeight: 800, color: DARK }}>{e.child_first_name} {e.child_last_name}</div>
            <div style={{ fontSize: "10px", color: MUTED, marginTop: "2px" }}>{e.applying_for_grade} · Academic Year {e.academic_year}</div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {student3x4Url   && <SafeImage src={student3x4Url}   alt="3×4"     style={box(58, 72)} label="3×4 Photo" />}
            {studentPhotoUrl && <SafeImage src={studentPhotoUrl} alt="Student"  style={box(58, 72)} label="Student Photo" />}
          </div>
        </div>

        {/* ── Row 1: Child Info | Parent 1 ───────────────────────────────── */}
        <TwoCol
          left={
            <Sec title="Child Information">
              <Row label="Full Name"       value={`${e.child_first_name} ${e.child_last_name}`} />
              <Row label="Date of Birth"   value={e.child_date_of_birth} />
              <Row label="Gender"          value={e.child_gender} />
              <Row label="Nationality"     value={e.child_nationality} />
              <Row label="Grade"           value={e.applying_for_grade} />
              <Row label="Academic Year"   value={e.academic_year} />
              <Row label="Previous School" value={e.previous_school} />
              <Row label="Languages"       value={e.languages_spoken} last />
            </Sec>
          }
          right={
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
                  <div style={{ padding: "5px", borderLeft: `1px solid ${LINE}`, background: "#f8fafc" }}>
                    <SafeImage src={parentPhotoUrl} alt="Parent" style={box(48, 60)} label="Parent" />
                  </div>
                )}
              </div>
            </Sec>
          }
        />

        <div style={{ height: "8px" }} />

        {/* ── Row 2: Home Address | Medical & Emergency ──────────────────── */}
        <TwoCol
          left={
            <Sec title="Home Address">
              <Row label="Street / Village" value={e.home_address} />
              <Row label="City / District"  value={e.city} last />
            </Sec>
          }
          right={
            <Sec title="Medical &amp; Emergency">
              <Row label="Medical"          value={e.medical_conditions} always />
              <Row label="Allergies"        value={e.allergies} always />
              <Row label="Emergency Name"   value={e.emergency_contact_name} />
              <Row label="Emergency Phone"  value={e.emergency_contact_phone} />
              <Row label="Relationship"     value={e.emergency_contact_relationship} last />
            </Sec>
          }
        />

        {/* ── Parent 2 (if any) ───────────────────────────────────────────── */}
        {e.parent2_full_name && (
          <>
            <div style={{ height: "8px" }} />
            <Sec title="Parent / Guardian 2">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <Row label="Full Name"    value={e.parent2_full_name} />
                  <Row label="Relationship" value={e.parent2_relationship} last />
                </div>
                <div style={{ borderLeft: `1px solid ${LINE}` }}>
                  <Row label="Phone" value={e.parent2_phone} />
                  <Row label="Email" value={e.parent2_email} last />
                </div>
              </div>
            </Sec>
          </>
        )}

        <div style={{ height: "8px" }} />

        {/* ── Row 3: Consent | Visit ──────────────────────────────────────── */}
        <TwoCol
          left={
            <Sec title="Photo &amp; Marketing Consent">
              <ConsentRow label="Social Media"     value={e.consent_social_media} />
              <ConsentRow label="Posters &amp; Ads" value={e.consent_marketing} last />
            </Sec>
          }
          right={
            e.visit_date ? (
              <Sec title="School Visit Request">
                <Row label="Preferred Date" value={e.visit_date} />
                <Row label="Preferred Time" value={e.visit_time} last />
              </Sec>
            ) : <div />
          }
        />

        <div style={{ height: "8px" }} />

        {/* ── Authorized Pickup Persons ───────────────────────────────────── */}
        {e.pickup_persons?.length > 0 && (
          <Sec title="Authorized to Pick Up Child">
            <div style={{ display: "grid", gridTemplateColumns: e.pickup_persons.length === 1 ? "1fr" : "1fr 1fr", gap: "0" }}>
              {e.pickup_persons.map((p, i) => {
                const isLast = i === e.pickup_persons.length - 1;
                const isOdd  = e.pickup_persons.length > 1 && i % 2 === 0;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex", gap: "8px", alignItems: "flex-start",
                      padding: "6px 8px",
                      borderBottom: isLast || (e.pickup_persons.length > 1 && i === e.pickup_persons.length - 2 && e.pickup_persons.length % 2 === 0) ? "none" : `1px solid ${LINE}`,
                      borderRight: isOdd ? `1px solid ${LINE}` : "none",
                      pageBreakInside: "avoid",
                    }}
                  >
                    {(pickupUrls[i].photo3x4 || pickupUrls[i].photoId) && (
                      <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                        {pickupUrls[i].photo3x4 && <SafeImage src={pickupUrls[i].photo3x4!} alt="3×4" style={box(44, 55)} label="3×4" />}
                        {pickupUrls[i].photoId  && <SafeImage src={pickupUrls[i].photoId!}  alt="ID"  style={box(44, 55)} label="ID" />}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "8px", fontWeight: 700, color: NAVY, letterSpacing: "0.05em", marginBottom: "3px" }}>PERSON {i + 1}</div>
                      <Row label="Name"         value={p.name} />
                      <Row label="Relationship" value={p.relationship} />
                      <Row label="Phone"        value={p.phone} />
                      {p.email && <Row label="Email" value={p.email} last />}
                    </div>
                  </div>
                );
              })}
            </div>
          </Sec>
        )}

        {/* ── Admin Notes ─────────────────────────────────────────────────── */}
        {e.admin_notes && (
          <>
            <div style={{ height: "8px" }} />
            <Sec title="Admin Notes">
              <div style={{ padding: "5px 8px", fontSize: "9px", color: DARK, whiteSpace: "pre-wrap" }}>{e.admin_notes}</div>
            </Sec>
          </>
        )}

        {/* ── Signatures ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "40px", marginTop: "20px", pageBreakInside: "avoid" }}>
          {["Parent / Guardian Signature", "School Authorized Signature"].map((lbl) => (
            <div key={lbl} style={{ flex: 1 }}>
              <div style={{ height: "32px", borderBottom: `1.5px solid ${DARK}` }} />
              <div style={{ fontSize: "8.5px", color: MUTED, marginTop: "3px" }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div style={{ marginTop: "10px", paddingTop: "6px", borderTop: `1px solid ${LINE}`, textAlign: "center", fontSize: "7.5px", color: "#94a3b8" }}>
          Child Development Academy – International School of Laos · Vientiane, Laos PDR · Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </div>

      </div>
    </>
  );
}
