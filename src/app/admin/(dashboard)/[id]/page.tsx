import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { Enrollment, EnrollmentStatus } from "@/lib/types";
import Link from "next/link";
import StatusUpdater from "@/components/StatusUpdater";

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
      <dt className="text-slate-500 dark:text-slate-400 text-sm">{label}</dt>
      <dd className="col-span-2 text-slate-800 dark:text-slate-100 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
      <h2 className="font-semibold text-blue-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-white/10">{title}</h2>
      <dl>{children}</dl>
    </div>
  );
}

function ConsentBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>;
  return value === "given" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-emerald-500/15 text-green-800 dark:text-emerald-300">
      ✓ Consent given
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-300">
      ✗ Consent not given
    </span>
  );
}

const STATUS_COLORS: Record<EnrollmentStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-800 dark:bg-amber-500/15 dark:text-amber-300",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  accepted: "bg-green-100 text-green-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("enrollments").select("*").eq("id", id).single();

  if (!data) notFound();
  const e = data as Enrollment;

  // Generate signed URLs for uploaded documents
  const getSignedUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("enrollment-docs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };
  const [studentPhotoUrl, parentPhotoUrl, student3x4Url] = await Promise.all([
    getSignedUrl(e.student_photo_path),
    getSignedUrl(e.parent_photo_path),
    getSignedUrl(e.student_3x4_path),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin" className="text-blue-700 hover:text-blue-900 text-sm">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/${e.id}/edit`}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          <Link
            href={`/admin/${e.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {e.child_first_name} {e.child_last_name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{e.applying_for_grade} · {e.academic_year}</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
            Submitted {new Date(e.created_at).toLocaleString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[e.status]}`}>
          {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
        </span>
      </div>

      {/* Status updater */}
      <StatusUpdater id={e.id} currentStatus={e.status} currentNotes={e.admin_notes} />

      {/* Documents */}
      {(student3x4Url || studentPhotoUrl || parentPhotoUrl) && (
        <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-blue-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-white/10">Documents</h2>
          <div className="grid grid-cols-2 gap-4">
            {student3x4Url && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Student 3×4 Photo</p>
                <a href={student3x4Url} target="_blank" rel="noopener noreferrer">
                  <img src={student3x4Url} alt="Student 3x4" className="w-full rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
                </a>
              </div>
            )}
            {studentPhotoUrl && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Student ID / Passport</p>
                <a href={studentPhotoUrl} target="_blank" rel="noopener noreferrer">
                  <img src={studentPhotoUrl} alt="Student document" className="w-full rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
                </a>
              </div>
            )}
            {parentPhotoUrl && (
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">Parent / Guardian ID / Passport</p>
                <a href={parentPhotoUrl} target="_blank" rel="noopener noreferrer">
                  <img src={parentPhotoUrl} alt="Parent document" className="w-full rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Child Information */}
      <Section title="Child Information">
        <Row label="First Name" value={e.child_first_name} />
        <Row label="Last Name" value={e.child_last_name} />
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
        <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-blue-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-white/10">Authorized to Pick Up</h2>
          <div className="space-y-4">
            {e.pickup_persons.map(async (p, i) => {
              const [photo3x4Url, photoIdUrl] = await Promise.all([
                p.photo_3x4_path ? (await supabase.storage.from("enrollment-docs").createSignedUrl(p.photo_3x4_path, 3600)).data?.signedUrl ?? null : null,
                p.photo_id_path ? (await supabase.storage.from("enrollment-docs").createSignedUrl(p.photo_id_path, 3600)).data?.signedUrl ?? null : null,
              ]);
              return (
                <div key={i} className="border border-slate-100 dark:border-white/10 rounded-lg p-4 bg-slate-50 dark:bg-white/3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Person {i + 1}</p>
                  <div className="flex gap-4 mb-3">
                    {photo3x4Url && (
                      <div>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">3×4 Photo</p>
                        <a href={photo3x4Url} target="_blank" rel="noopener noreferrer">
                          <img src={photo3x4Url} alt="3x4" className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:opacity-90" />
                        </a>
                      </div>
                    )}
                    {photoIdUrl && (
                      <div>
                        <p className="text-slate-400 dark:text-slate-500 text-xs mb-1">ID / Passport</p>
                        <a href={photoIdUrl} target="_blank" rel="noopener noreferrer">
                          <img src={photoIdUrl} alt="ID" className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:opacity-90" />
                        </a>
                      </div>
                    )}
                  </div>
                  <dl>
                    <Row label="Full Name" value={p.name} />
                    <Row label="Relationship" value={p.relationship} />
                    <Row label="Phone" value={p.phone} />
                    {p.email && <Row label="Email" value={p.email} />}
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Photo Consent */}
      <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-blue-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-white/10">Photo Consent</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-100 dark:border-white/10">
            <dt className="text-slate-500 dark:text-slate-400 text-sm">Social Media</dt>
            <dd className="col-span-2"><ConsentBadge value={e.consent_social_media} /></dd>
          </div>
          <div className="grid grid-cols-3 gap-2 py-3">
            <dt className="text-slate-500 dark:text-slate-400 text-sm">Posters & Ads</dt>
            <dd className="col-span-2"><ConsentBadge value={e.consent_marketing} /></dd>
          </div>
        </div>
      </div>

      {/* School Visit */}
      {e.visit_date && (
        <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-blue-100 dark:border-white/10 shadow-sm p-6 mb-5">
          <h2 className="font-semibold text-blue-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-white/10">School Visit Request</h2>
          <dl>
            <Row label="Preferred Date" value={e.visit_date} />
            <Row label="Preferred Time" value={e.visit_time} />
          </dl>
        </div>
      )}
    </div>
  );
}
