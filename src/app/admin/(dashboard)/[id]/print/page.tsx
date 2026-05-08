import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Enrollment } from "@/lib/types";
import PrintButton from "./PrintButton";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  reviewed: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ background: "#1e3a8a", color: "white", padding: "4px 10px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "6px" }}>
        {title.toUpperCase()}
      </div>
      <div style={{ padding: "0 4px" }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "3px 0", fontSize: "11px" }}>
      <span style={{ color: "#64748b", width: "160px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#1e293b", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ConsentValue({ value }: { value?: string | null }) {
  if (!value) return <span style={{ color: "#94a3b8" }}>—</span>;
  return value === "given"
    ? <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ Consent given</span>
    : <span style={{ color: "#dc2626", fontWeight: 600 }}>✗ Consent not given</span>;
}

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("enrollments").select("*").eq("id", id).single();
  if (!data) notFound();
  const e = data as Enrollment;

  const getSignedUrl = async (path: string | null | undefined) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("enrollment-docs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const student3x4Url = await getSignedUrl(e.student_3x4_path);

  const pickupPhotoUrls = await Promise.all(
    e.pickup_persons.map((p) => getSignedUrl(p.photo_3x4_path))
  );

  const submittedDate = new Date(e.created_at).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <>

      <style>{`
        @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: white; }
      `}</style>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "20px", background: "white", minHeight: "297mm" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #1e3a8a", paddingBottom: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CDI" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#1e3a8a" }}>Child Development Academy</div>
              <div style={{ fontSize: "12px", color: "#475569" }}>International School of Laos · Vientiane, Laos PDR</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Enrollment Application</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Submitted: {submittedDate}</div>
            <div style={{
              display: "inline-block", marginTop: "4px", padding: "2px 10px", borderRadius: "999px",
              fontSize: "11px", fontWeight: 700,
              background: e.status === "accepted" ? "#dcfce7" : e.status === "rejected" ? "#fee2e2" : e.status === "reviewed" ? "#dbeafe" : "#fef9c3",
              color: e.status === "accepted" ? "#15803d" : e.status === "rejected" ? "#b91c1c" : e.status === "reviewed" ? "#1d4ed8" : "#854d0e",
            }}>
              {STATUS_LABELS[e.status] ?? e.status}
            </div>
          </div>
        </div>

        {/* Student name + portrait photo */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
              {e.child_first_name} {e.child_last_name}
            </div>
            <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
              {e.applying_for_grade} · Academic Year {e.academic_year}
            </div>
          </div>
          {student3x4Url && (
            <div style={{ textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={student3x4Url} alt="Student photo" style={{ width: "80px", height: "100px", objectFit: "cover", border: "1px solid #cbd5e1" }} />
              <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>Student Photo</div>
            </div>
          )}
        </div>

        {/* Child Information */}
        <Section title="Child Information">
          <Row label="Full Name" value={`${e.child_first_name} ${e.child_last_name}`} />
          <Row label="Date of Birth" value={e.child_date_of_birth} />
          <Row label="Gender" value={e.child_gender} />
          <Row label="Nationality" value={e.child_nationality} />
          <Row label="Applying for Grade" value={e.applying_for_grade} />
          <Row label="Academic Year" value={e.academic_year} />
          <Row label="Previous School" value={e.previous_school} />
          <Row label="Languages Spoken" value={e.languages_spoken} />
        </Section>

        {/* Parent 1 */}
        <Section title="Parent / Guardian 1">
          <Row label="Full Name" value={e.parent1_full_name} />
          <Row label="Relationship" value={e.parent1_relationship} />
          <Row label="Phone" value={e.parent1_phone} />
          <Row label="Email" value={e.parent1_email} />
          <Row label="Occupation" value={e.parent1_occupation} />
        </Section>

        {/* Parent 2 */}
        {e.parent2_full_name && (
          <Section title="Parent / Guardian 2">
            <Row label="Full Name" value={e.parent2_full_name} />
            <Row label="Relationship" value={e.parent2_relationship} />
            <Row label="Phone" value={e.parent2_phone} />
            <Row label="Email" value={e.parent2_email} />
          </Section>
        )}

        {/* Address */}
        <Section title="Home Address">
          <Row label="Street Address" value={e.home_address} />
          <Row label="City" value={e.city} />
        </Section>

        {/* Medical */}
        <Section title="Medical & Emergency">
          <Row label="Medical Conditions" value={e.medical_conditions} />
          <Row label="Allergies" value={e.allergies} />
          <Row label="Emergency Contact" value={e.emergency_contact_name} />
          <Row label="Emergency Phone" value={e.emergency_contact_phone} />
          <Row label="Relationship to Child" value={e.emergency_contact_relationship} />
        </Section>

        {/* Pickup Persons */}
        {e.pickup_persons?.length > 0 && (
          <Section title="Authorized to Pick Up Child">
            {e.pickup_persons.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", borderBottom: i < e.pickup_persons.length - 1 ? "1px dashed #e2e8f0" : "none", paddingBottom: "8px", marginBottom: "8px" }}>
                {pickupPhotoUrls[i] && (
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pickupPhotoUrls[i]!} alt="Guardian photo" style={{ width: "60px", height: "75px", objectFit: "cover", border: "1px solid #cbd5e1" }} />
                    <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>Photo</div>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "3px" }}>Person {i + 1}</div>
                  <Row label="Full Name" value={p.name} />
                  <Row label="Relationship" value={p.relationship} />
                  <Row label="Phone" value={p.phone} />
                  {p.email && <Row label="Email" value={p.email} />}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Photo Consent */}
        <Section title="Photo Consent">
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "3px 0", fontSize: "11px" }}>
            <span style={{ color: "#64748b", width: "160px", flexShrink: 0 }}>Social Media</span>
            <ConsentValue value={e.consent_social_media} />
          </div>
          <div style={{ display: "flex", padding: "3px 0", fontSize: "11px" }}>
            <span style={{ color: "#64748b", width: "160px", flexShrink: 0 }}>Posters & Advertisements</span>
            <ConsentValue value={e.consent_marketing} />
          </div>
        </Section>

        {/* School Visit */}
        {e.visit_date && (
          <Section title="School Visit Request">
            <Row label="Preferred Date" value={e.visit_date} />
            <Row label="Preferred Time" value={e.visit_time} />
          </Section>
        )}

        {/* Admin Notes */}
        {e.admin_notes && (
          <Section title="Admin Notes">
            <div style={{ fontSize: "11px", color: "#1e293b", padding: "4px 0", whiteSpace: "pre-wrap" }}>{e.admin_notes}</div>
          </Section>
        )}

        {/* Footer */}
        <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", textAlign: "center", fontSize: "9px", color: "#94a3b8" }}>
          Child Development Academy – International School of Laos · Vientiane, Laos PDR · Generated {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </div>

        <PrintButton backUrl="/admin?section=master&status=accepted" />
      </div>
    </>
  );
}
