import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Enrollment } from "@/lib/types";
import PrintButton from "./PrintButton";
import SafeImage from "./SafeImage";

const STATUS_LABELS: Record<string, string> = {
  pending:  "Pending Review",
  reviewed: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  accepted: { bg: "#dcfce7", fg: "#15803d" },
  rejected: { bg: "#fee2e2", fg: "#b91c1c" },
  reviewed: { bg: "#dbeafe", fg: "#1d4ed8" },
  pending:  { bg: "#fef9c3", fg: "#854d0e" },
};

// ── Shared constants ─────────────────────────────────────────────────────────
const BLUE   = "#1e3a8a";
const DARK   = "#0f172a";
const GREY   = "#64748b";
const BORDER = "1px solid #e2e8f0";

// ── Helpers ──────────────────────────────────────────────────────────────────
function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "8px", pageBreakInside: "avoid" }}>
      <div style={{ background: BLUE, color: "#fff", padding: "3px 8px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.07em", marginBottom: "3px" }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, always }: { label: string; value?: string | null; always?: boolean }) {
  if (!always && !value) return null;
  return (
    <div style={{ display: "flex", borderBottom: BORDER, padding: "2px 4px", fontSize: "10px" }}>
      <span style={{ color: GREY, width: "150px", flexShrink: 0, fontSize: "9.5px" }}>{label}</span>
      <span style={{ color: DARK, fontWeight: 500, flex: 1 }}>{value || "—"}</span>
    </div>
  );
}

function ConsentRow({ label, value }: { label: string; value?: string | null }) {
  const given = value === "given";
  return (
    <div style={{ display: "flex", borderBottom: BORDER, padding: "2px 4px", fontSize: "10px" }}>
      <span style={{ color: GREY, width: "150px", flexShrink: 0, fontSize: "9.5px" }}>{label}</span>
      <span style={{ color: given ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
        {given ? "✓ Given" : "✗ Not Given"}
      </span>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
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

  const [student3x4Url, studentPhotoUrl, parentPhotoUrl] = await Promise.all([
    signedUrl(e.student_3x4_path),
    signedUrl(e.student_photo_path),
    signedUrl(e.parent_photo_path),
  ]);

  const pickupUrls = await Promise.all(
    e.pickup_persons.map(async (p) => ({
      photo3x4: await signedUrl(p.photo_3x4_path),
      photoId:  await signedUrl(p.photo_id_path),
    }))
  );

  const submitted = new Date(e.created_at).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const sc = STATUS_COLOR[e.status] ?? STATUS_COLOR.pending;

  const photoStyle = (w: number, h: number): React.CSSProperties => ({
    width: w, height: h, objectFit: "cover", border: BORDER, display: "block",
  });

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm 12mm 12mm 12mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; background: white; }
      `}</style>

      <div style={{ maxWidth: "186mm", margin: "0 auto", background: "white" }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${BLUE}`, paddingBottom: "10px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CDA" style={{ width: 52, height: 52, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: BLUE }}>Child Development Academy</div>
              <div style={{ fontSize: "10px", color: GREY }}>International School of Laos · Vientiane, Laos PDR</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: GREY }}>Enrollment Application</div>
            <div style={{ fontSize: "10px", color: GREY }}>Submitted: {submitted}</div>
            <div style={{ display: "inline-block", marginTop: "3px", padding: "2px 8px", borderRadius: 999, fontSize: "10px", fontWeight: 700, background: sc.bg, color: sc.fg }}>
              {STATUS_LABELS[e.status] ?? e.status}
            </div>
          </div>
        </div>

        {/* ── Student name + photos ─────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: DARK }}>
              {e.child_first_name.toUpperCase()} {e.child_last_name.toUpperCase()}
            </div>
            <div style={{ fontSize: "11px", color: GREY, marginTop: "2px" }}>
              {e.applying_for_grade} · Academic Year {e.academic_year}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {student3x4Url   && <SafeImage src={student3x4Url}   alt="3×4 photo"     style={photoStyle(64, 80)} label="3×4 Photo" />}
            {studentPhotoUrl && <SafeImage src={studentPhotoUrl} alt="Student photo"  style={photoStyle(64, 80)} label="Student Photo" />}
          </div>
        </div>

        {/* ── Child Info ────────────────────────────────────────────────────── */}
        <Sec title="Child Information">
          <Row label="Full Name"       value={`${e.child_first_name} ${e.child_last_name}`} />
          <Row label="Date of Birth"   value={e.child_date_of_birth} />
          <Row label="Gender"          value={e.child_gender} />
          <Row label="Nationality"     value={e.child_nationality} />
          <Row label="Grade"           value={e.applying_for_grade} />
          <Row label="Academic Year"   value={e.academic_year} />
          <Row label="Previous School" value={e.previous_school} />
          <Row label="Languages"       value={e.languages_spoken} />
        </Sec>

        {/* ── Parent 1 ─────────────────────────────────────────────────────── */}
        <Sec title="Parent / Guardian 1">
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <Row label="Full Name"    value={e.parent1_full_name} />
              <Row label="Relationship" value={e.parent1_relationship} />
              <Row label="Phone"        value={e.parent1_phone} />
              <Row label="Email"        value={e.parent1_email} />
              <Row label="Occupation"   value={e.parent1_occupation} />
            </div>
            {parentPhotoUrl && (
              <SafeImage src={parentPhotoUrl} alt="Parent photo" style={photoStyle(60, 75)} label="Parent Photo" />
            )}
          </div>
        </Sec>

        {/* ── Parent 2 ─────────────────────────────────────────────────────── */}
        {e.parent2_full_name && (
          <Sec title="Parent / Guardian 2">
            <Row label="Full Name"    value={e.parent2_full_name} />
            <Row label="Relationship" value={e.parent2_relationship} />
            <Row label="Phone"        value={e.parent2_phone} />
            <Row label="Email"        value={e.parent2_email} />
          </Sec>
        )}

        {/* ── Home Address ─────────────────────────────────────────────────── */}
        <Sec title="Home Address">
          <Row label="Street Address" value={e.home_address} />
          <Row label="City"           value={e.city} />
        </Sec>

        {/* ── Medical & Emergency ──────────────────────────────────────────── */}
        <Sec title="Medical &amp; Emergency">
          <Row label="Medical Conditions" value={e.medical_conditions} always />
          <Row label="Allergies"          value={e.allergies} always />
          <Row label="Emergency Contact"  value={e.emergency_contact_name} />
          <Row label="Emergency Phone"    value={e.emergency_contact_phone} />
          <Row label="Relationship"       value={e.emergency_contact_relationship} />
        </Sec>

        {/* ── Pickup Persons ───────────────────────────────────────────────── */}
        {e.pickup_persons?.length > 0 && (
          <Sec title="Authorized to Pick Up Child">
            {e.pickup_persons.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", borderBottom: i < e.pickup_persons.length - 1 ? "1px dashed #e2e8f0" : "none", paddingBottom: "6px", marginBottom: "6px", pageBreakInside: "avoid" }}>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  {pickupUrls[i].photo3x4 && <SafeImage src={pickupUrls[i].photo3x4!} alt="3×4"   style={photoStyle(52, 65)} label="3×4" />}
                  {pickupUrls[i].photoId  && <SafeImage src={pickupUrls[i].photoId!}  alt="ID photo" style={photoStyle(52, 65)} label="ID" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "9px", color: GREY, fontWeight: 700, marginBottom: "2px" }}>PERSON {i + 1}</div>
                  <Row label="Name"         value={p.name} />
                  <Row label="Relationship" value={p.relationship} />
                  <Row label="Phone"        value={p.phone} />
                  {p.email && <Row label="Email" value={p.email} />}
                </div>
              </div>
            ))}
          </Sec>
        )}

        {/* ── Consent ──────────────────────────────────────────────────────── */}
        <Sec title="Photo &amp; Marketing Consent">
          <ConsentRow label="Social Media"     value={e.consent_social_media} />
          <ConsentRow label="Posters &amp; Ads" value={e.consent_marketing} />
        </Sec>

        {/* ── School Visit ─────────────────────────────────────────────────── */}
        {e.visit_date && (
          <Sec title="School Visit Request">
            <Row label="Preferred Date" value={e.visit_date} />
            <Row label="Preferred Time" value={e.visit_time} />
          </Sec>
        )}

        {/* ── Admin Notes ──────────────────────────────────────────────────── */}
        {e.admin_notes && (
          <Sec title="Admin Notes">
            <div style={{ fontSize: "10px", color: DARK, whiteSpace: "pre-wrap", padding: "3px 4px" }}>{e.admin_notes}</div>
          </Sec>
        )}

        {/* ── Signatures ───────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "48px", marginTop: "24px", pageBreakInside: "avoid" }}>
          {["Parent / Guardian Signature", "School Authorized Signature"].map((lbl) => (
            <div key={lbl} style={{ flex: 1 }}>
              <div style={{ borderBottom: `1px solid ${DARK}`, height: "28px" }} />
              <div style={{ fontSize: "9px", color: GREY, marginTop: "3px" }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{ marginTop: "10px", borderTop: BORDER, paddingTop: "5px", textAlign: "center", fontSize: "8px", color: "#94a3b8" }}>
          Child Development Academy – International School of Laos · Vientiane, Laos PDR · Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </div>

        <PrintButton backUrl="/admin?section=master&status=accepted" />
      </div>
    </>
  );
}
