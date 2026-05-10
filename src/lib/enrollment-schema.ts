import { z } from "zod";

export const GRADES = [
  "Toddler (18–30 months)",
  "Nursery (30–42 months)",
  "Reception (42–54 months)",
  "Pre-KG (54–72 months)",
] as const;

export const pickupPersonSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  relationship: z.string().min(1, "Relationship is required").max(60),
  phone: z.string().min(1, "Phone is required").max(40),
  email: z.string().check(z.email({ error: "Invalid email" })).optional().or(z.literal("")),
});

export const enrollmentSchema = z.object({
  child_first_name: z.string().min(1, "First name is required").max(80),
  child_last_name: z.string().min(1, "Last name is required").max(80),
  child_date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  child_gender: z.enum(["male", "female", "other"], { error: "Please select a gender" }),
  child_nationality: z.string().min(1, "Nationality is required").max(60),
  applying_for_grade: z.enum(GRADES, { error: "Please select a valid grade" }),
  academic_year: z.string().regex(/^\d{4}[–—\-]\d{4}$/, "Academic year must be like 2026-2027"),
  previous_school: z.string().max(160).optional(),
  languages_spoken: z.string().max(160).optional(),

  parent1_full_name: z.string().min(1, "Parent/Guardian name is required").max(120),
  parent1_relationship: z.string().min(1, "Relationship is required").max(60),
  parent1_phone: z.string().min(1, "Phone number is required").max(40),
  parent1_email: z.string().check(z.email({ error: "Invalid email address" })),
  parent1_occupation: z.string().max(120).optional(),

  parent2_full_name: z.string().max(120).optional(),
  parent2_relationship: z.string().max(60).optional(),
  parent2_phone: z.string().max(40).optional(),
  parent2_email: z.string().check(z.email({ error: "Invalid email" })).optional().or(z.literal("")),

  home_address: z.string().min(1, "Home address is required").max(240),
  city: z.string().min(1, "City is required").max(80),

  medical_conditions: z.string().min(1, "Please describe any medical conditions, or write 'None'").max(1000),
  allergies: z.string().min(1, "Please describe any allergies, or write 'None'").max(1000),
  emergency_contact_name: z.string().min(1, "Emergency contact name is required").max(120),
  emergency_contact_phone: z.string().min(1, "Emergency contact phone is required").max(40),
  emergency_contact_relationship: z.string().min(1, "Relationship is required").max(60),

  pickup_persons: z.array(pickupPersonSchema).min(1, "At least one pickup person is required").max(10),

  consent_social_media: z.enum(["given", "not_given"], { error: "Please select an option" }),
  consent_marketing: z.enum(["given", "not_given"], { error: "Please select an option" }),

  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date").optional().or(z.literal("")),
  visit_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time").optional().or(z.literal("")),
});

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
