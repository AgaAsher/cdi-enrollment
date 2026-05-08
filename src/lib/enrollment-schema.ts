import { z } from "zod";

export const pickupPersonSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().check(z.email({ error: "Invalid email" })).optional().or(z.literal("")),
});

export const enrollmentSchema = z.object({
  child_first_name: z.string().min(1, "First name is required"),
  child_last_name: z.string().min(1, "Last name is required"),
  child_date_of_birth: z.string().min(1, "Date of birth is required"),
  child_gender: z.enum(["male", "female", "other"], { error: "Please select a gender" }),
  child_nationality: z.string().min(1, "Nationality is required"),
  applying_for_grade: z.string().min(1, "Please select a grade"),
  academic_year: z.string().min(1, "Academic year is required"),
  previous_school: z.string().optional(),
  languages_spoken: z.string().optional(),

  parent1_full_name: z.string().min(1, "Parent/Guardian name is required"),
  parent1_relationship: z.string().min(1, "Relationship is required"),
  parent1_phone: z.string().min(1, "Phone number is required"),
  parent1_email: z.string().check(z.email({ error: "Invalid email address" })),
  parent1_occupation: z.string().optional(),

  parent2_full_name: z.string().optional(),
  parent2_relationship: z.string().optional(),
  parent2_phone: z.string().optional(),
  parent2_email: z.string().check(z.email({ error: "Invalid email" })).optional().or(z.literal("")),

  home_address: z.string().min(1, "Home address is required"),
  city: z.string().min(1, "City is required"),

  medical_conditions: z.string().min(1, "Please describe any medical conditions, or write 'None'"),
  allergies: z.string().min(1, "Please describe any allergies, or write 'None'"),
  emergency_contact_name: z.string().min(1, "Emergency contact name is required"),
  emergency_contact_phone: z.string().min(1, "Emergency contact phone is required"),
  emergency_contact_relationship: z.string().min(1, "Relationship is required"),

  pickup_persons: z.array(pickupPersonSchema).min(1, "At least one pickup person is required"),

  consent_social_media: z.enum(["given", "not_given"], { error: "Please select an option" }),
  consent_marketing: z.enum(["given", "not_given"], { error: "Please select an option" }),

  visit_date: z.string().optional(),
  visit_time: z.string().optional(),
});

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
