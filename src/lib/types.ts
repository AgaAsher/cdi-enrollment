export type EnrollmentStatus = "pending" | "reviewed" | "accepted" | "rejected";

export type TranscriptStudent = {
  id: string;
  name: string;
  student_no: string;
  year_group: string;
  academic_year: string;
  created_at: string;
};

export type TranscriptCourse = {
  id: string;
  student_id: string;
  name: string;
  half_year_avg: number | null;
  teaching_hours: number;
  final_avg: number | null;
  sort_order: number;
};

export interface Enrollment {
  id: string;
  created_at: string;
  status: EnrollmentStatus;
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  child_gender: string;
  child_nationality: string;
  applying_for_grade: string;
  academic_year: string;
  previous_school: string | null;
  languages_spoken: string | null;
  parent1_full_name: string;
  parent1_relationship: string;
  parent1_phone: string;
  parent1_email: string;
  parent1_occupation: string | null;
  parent2_full_name: string | null;
  parent2_relationship: string | null;
  parent2_phone: string | null;
  parent2_email: string | null;
  home_address: string;
  city: string;
  medical_conditions: string | null;
  allergies: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  admin_notes: string | null;
  student_photo_path: string | null;
  parent_photo_path: string | null;
  student_3x4_path: string | null;
  pickup_persons: { name: string; relationship: string; phone: string; email?: string; photo_3x4_path?: string; photo_id_path?: string }[];
  consent_social_media: "given" | "not_given";
  consent_marketing: "given" | "not_given";
  visit_date: string | null;
  visit_time: string | null;
  deleted_at: string | null;
}
