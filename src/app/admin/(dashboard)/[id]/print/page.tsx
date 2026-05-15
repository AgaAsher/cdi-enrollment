import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Enrollment } from "@/lib/types";
import PrintButton from "./PrintButton";

const STATUS_LABELS: Record<string, string> = {
  pending:  "Pending Review",
  reviewed: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  accepted: { bg: "#dcfce7", color: "#15803d" },
  rejected: { bg: "#fee2e2", color: "#b91c1c" },
  reviewed: { bg: "#dbeafe", color: "#1d4ed8" },
  pending:  { bg: "#fef9c3", color: "#854d0e" },
};

// ─── Shared style tokens ────────────────────────────────────────────────────
const NAV_BLUE = "#1e3a8a";
const TEXT_DARK = "#0f172a";
const TEXT_GREY = "#64748b";
const DIVIDER   = "#e2e8f0";
const FONT      = "Arial, Helvetica, sans-serif";

// ─── Sub-components ─────────────────────────────────────────────────────────
function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ pageBreakInside: "avoid", marginBottom: "10px", ...style }}>
      <div style={{ background: NAV_BLUE, color: "white", padding: "3px 8px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "4px" }}>
        {title.toUpperCase()}
      </div>
      <div style={{ padding: "0 2px" }}>{children}</div>
    </div>
  );
}

function Row({ label, value, always }: { label: string; value?: string | null; always?: boolean }) {
  if (!always && !value) return null;
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${DIVIDER}`, padding: "2px 0", fontSize: "10px" }}>
      <span style={{ color: TEXT_GREY, width: "140px", flexShrink: 0, fontSize: "9.5px" }}>{label}</span>
      <span style={{ color: TEXT_DARK, fontWeight: 500, flex: 1 }}>{value || "—"}</span>
    </div>
  );
}

function ConsentRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${DIVIDER}`, padding: "2px 0", fontSize: "10px" }}>
      <span style={{ color: TEXT_GREY, width: "140px", flexShrink: 0, fontSize: "9.5px" }}>{label}</span>
      {value === "given"
        ? <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "10px" }}>✓ Given</span>
        : <span style={{ color: "#dc2626", fontWeight: 600, fontSize: "10px" }}>✗ Not Given</span>}
    </div>
  );
}

function Photo({ src, label, w = 70, h = 88 }: { src: string; label: string; w?: number; h?: number }) {
  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} style={{ width: w, height: h, objectFit: "cover", border: `1px solid ${DIVIDER}`, display: "block" }} />
      <div style={{ fontSize: "8px", color: "#94a3b8", marginTop: "2px" }}>{label}</div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("enrollments").select("*").eq("id", id).single();
  if (!data) notFound();
  const e = data as Enrollment;

  const signedUrl = async (path?: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("enrollment-docs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const [studentPhotoUrl, student3x4Url, parentPhotoUrl] = await Promise.all([
    signedUrl(e.student_photo_path),
    signedUrl(e.student_3x4_path),
    signedUrl(e.parent_photo_path),
  ]);

  const pickupUrls = await Promise.all(
    e.pickup_persons.map(async (p) => ({
      photo3x4: await signedUrl(p.photo_3x4_path),
      photoId:  await signedUrl(p.photo_id_path),
    }))
  );

  const submittedDate = new Date(e.created_at).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const statusStyle = STATUS_COLORS[e.status] ?? STATUS_COLORS.pending;

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm 12mm 12mm 12mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${FONT}; background: white; color: ${TEXT_DARK}; }
      `}</style>

      <div style={{ maxWidth: "176mm", margin: "0 auto", background: "white", padding: "0" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${NAV_BLUE}`, paddingBottom: "10px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CDA" style={{ width: 54, height: 54, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: NAV_BLUE }}>Child Development Academy</div>
              <div style={{ fontSize: "10px", color: TEXT_GREY }}>International School of Laos · Vientiane, Laos PDR</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: TEXT_GREY }}>Enrollment Application</div>
            <div style={{ fontSize: "10px", color: TEXT_GREY }}>Submitted: {submittedDate}</div>
            <div style={{ display: "inline-block", marginTop: "3px", padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>
              {STATUS_LABELS[e.status] ?? e.status}
            </div>
          </div>
        </div>

        {/* ── Student name banner ─────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: TEXT_DARK, letterSpacing: "-0.02em" }}>
              {e.child_first_name.toUpperCase()} {e.child_last_name.toUpperCase()}
            </div>
            <div style={{ fontSize: "11px", color: TEXT_GREY, marginTop: "2px" }}>
              {e.applying_for_grade} · Academic Year {e.academic_year}
            </div>
          </div>
          {/* Photos: 3×4 + regular */}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            {student3x4Url && <Photo src={student3x4Url} label="3×4 Photo" w={64} h={80} />}
            {studentPhotoUrl && <Photo src={studentPhotoUrl} label="Student Photo" w={64} h={80} />}
          </div>
        </div>

        {/* ── Row 1: Child Info + Parent 1 ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "0" }}>
          <Section title="Child Information">
            <Row label="Full Name"      value={`${e.child_first_name} ${e.child_last_name}`} />
            <Row label="Date of Birth"  value={e.child_date_of_birth} />
            <Row label="Gender"         value={e.child_gender} />
            <Row label="Nationality"    value={e.child_nationality} />
            <Row label="Grade"          value={e.applying_for_grade} />
            <Row label="Academic Year"  value={e.academic_year} />
            <Row label="Previous School" value={e.previous_school} />
            <Row label="Languages"      value={e.languages_spoken} />
          </Section>

          <div>
            <Section title="Parent / Guardian 1">
              <Row label="Full Name"     value={e.parent1_full_name} />
              <Row label="Relationship"  value={e.parent1_relationship} />
              <Row label="Phone"         value={e.parent1_phone} />
              <Row label="Email"         value={e.parent1_email} />
              <Row label="Occupation"    value={e.parent1_occupation} />
            </Section>

            {/* Parent photo inline with Parent 1 */}
            {parentPhotoUrl && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                <Photo src={parentPhotoUrl} label="Parent Photo" w={60} h={75} />
              </div>
            )}
          </div>
        </div>

        {/* ── Row 2: Parent 2 + Home Address ──────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "0" }}>
          {e.parent2_full_name ? (
            <Section title="Parent / Guardian 2">
              <Row label="Full Name"    value={e.parent2_full_name} />
              <Row label="Relationship" value={e.parent2_relationship} />
              <Row label="Phone"        value={e.parent2_phone} />
              <Row label="Email"        value={e.parent2_email} />
            </Section>
          ) : <div />}

          <Section title="Home Address">
            <Row label="Street Address" value={e.home_address} />
            <Row label="City"           value={e.city} />
          </Section>
        </div>

        {/* ── Row 3: Medical/Emergency + Consents/Visit ───────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "0" }}>
          <Section title="Medical &amp; Emergency">
            <Row label="Medical Conditions" value={e.medical_conditions} always />
            <Row label="Allergies"          value={e.allergies} always />
            <Row label="Emergency Contact"  value={e.emergency_contact_name} />
            <Row label="Emergency Phone"    value={e.emergency_contact_phone} />
            <Row label="Relationship"       value={e.emergency_contact_relationship} />
          </Section>

          <div>
            <Section title="Photo &amp; Marketing Consent">
              <ConsentRow label="Social Media"          value={e.consent_social_media} />
              <ConsentRow label="Posters &amp; Ads"     value={e.consent_marketing} />
            </Section>

            {e.visit_date && (
              <Section title="School Visit Request">
                <Row label="Preferred Date" value={e.visit_date} />
                <Row label="Preferred Time" value={e.visit_time} />
              </Section>
            )}
          </div>
        </div>

        {/* ── Authorized Pickup Persons ────────────────────────────────────── */}
        {e.pickup_persons?.length > 0 && (
          <Section title="Authorized to Pick Up Child">
            <div style={{ display: "grid", gridTemplateColumns: e.pickup_persons.length === 1 ? "1fr" : "1fr 1fr", gap: "8px" }}>
              {e.pickup_persons.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", border: `1px solid ${DIVIDER}`, borderRadius: "4px", padding: "6px", pageBreakInside: "avoid" }}>
                  {/* Photos side by side */}
                  {(pickupUrls[i].photo3x4 || pickupUrls[i].photoId) && (
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      {pickupUrls[i].photo3x4 && <Photo src={pickupUrls[i].photo3x4!} label="3×4" w={48} h={60} />}
                      {pickupUrls[i].photoId  && <Photo src={pickupUrls[i].photoId!}  label="ID"  w={48} h={60} />}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "9px", color: TEXT_GREY, fontWeight: 600, marginBottom: "3px" }}>PERSON {i + 1}</div>
                    <Row label="Name"         value={p.name} />
                    <Row label="Relationship" value={p.relationship} />
                    <Row label="Phone"        value={p.phone} />
                    {p.email && <Row label="Email" value={p.email} />}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Admin Notes ──────────────────────────────────────────────────── */}
        {e.admin_notes && (
          <Section title="Admin Notes">
            <div style={{ fontSize: "10px", color: TEXT_DARK, whiteSpace: "pre-wrap", padding: "3px 0" }}>{e.admin_notes}</div>
          </Section>
        )}

        {/* ── Signature line ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "20px", pageBreakInside: "avoid" }}>
          {["Parent / Guardian Signature", "School Authorized Signature"].map((label) => (
            <div key={label}>
              <div style={{ borderBottom: `1px solid ${TEXT_DARK}`, height: "32px" }} />
              <div style={{ fontSize: "9px", color: TEXT_GREY, marginTop: "3px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div style={{ marginTop: "12px", borderTop: `1px solid ${DIVIDER}`, paddingTop: "6px", textAlign: "center", fontSize: "8px", color: "#94a3b8" }}>
          Child Development Academy – International School of Laos · Vientiane, Laos PDR · Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </div>

        <PrintButton backUrl="/admin?section=master&status=accepted" />
      </div>
    </>
  );
}
