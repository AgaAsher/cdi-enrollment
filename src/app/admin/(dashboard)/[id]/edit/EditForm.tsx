"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enrollmentSchema, EnrollmentFormData } from "@/lib/enrollment-schema";
import { Enrollment } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
      <h2 className="font-semibold text-blue-900 dark:text-white text-base mb-4 pb-2 border-b border-slate-100 dark:border-white/10">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, full, error, children }: {
  label: string; required?: boolean; full?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function EditForm({ enrollment }: { enrollment: Enrollment }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      child_first_name: enrollment.child_first_name,
      child_last_name: enrollment.child_last_name,
      child_date_of_birth: enrollment.child_date_of_birth,
      child_gender: enrollment.child_gender as EnrollmentFormData["child_gender"],
      child_nationality: enrollment.child_nationality,
      applying_for_grade: enrollment.applying_for_grade as EnrollmentFormData["applying_for_grade"],
      academic_year: enrollment.academic_year,
      previous_school: enrollment.previous_school ?? "",
      languages_spoken: enrollment.languages_spoken ?? "",
      parent1_full_name: enrollment.parent1_full_name,
      parent1_relationship: enrollment.parent1_relationship,
      parent1_phone: enrollment.parent1_phone,
      parent1_email: enrollment.parent1_email,
      parent1_occupation: enrollment.parent1_occupation ?? "",
      parent2_full_name: enrollment.parent2_full_name ?? "",
      parent2_relationship: enrollment.parent2_relationship ?? "",
      parent2_phone: enrollment.parent2_phone ?? "",
      parent2_email: enrollment.parent2_email ?? "",
      home_address: enrollment.home_address,
      city: enrollment.city,
      medical_conditions: enrollment.medical_conditions ?? "",
      allergies: enrollment.allergies ?? "",
      emergency_contact_name: enrollment.emergency_contact_name,
      emergency_contact_phone: enrollment.emergency_contact_phone,
      emergency_contact_relationship: enrollment.emergency_contact_relationship,
      pickup_persons: enrollment.pickup_persons.map((p) => ({
        name: p.name,
        relationship: p.relationship,
        phone: p.phone,
        email: p.email ?? "",
      })),
      consent_social_media: enrollment.consent_social_media,
      consent_marketing: enrollment.consent_marketing,
      visit_date: enrollment.visit_date ?? "",
      visit_time: enrollment.visit_time ?? "",
    },
  });

  const { fields: pickupFields, append: addPickup, remove: removePickup } = useFieldArray({
    control,
    name: "pickup_persons",
  });

  async function onSubmit(data: EnrollmentFormData) {
    setServerError("");
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      router.push(`/admin/${enrollment.id}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Section title="Child Information">
        <Field label="First Name" required error={errors.child_first_name?.message}>
          <Input {...register("child_first_name")} />
        </Field>
        <Field label="Last Name" required error={errors.child_last_name?.message}>
          <Input {...register("child_last_name")} />
        </Field>
        <Field label="Date of Birth" required error={errors.child_date_of_birth?.message}>
          <Input type="date" {...register("child_date_of_birth")} />
        </Field>
        <Field label="Gender" required error={errors.child_gender?.message}>
          <select {...register("child_gender")} className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Nationality" required error={errors.child_nationality?.message}>
          <Input {...register("child_nationality")} />
        </Field>
        <Field label="Grade" required error={errors.applying_for_grade?.message}>
          <Input {...register("applying_for_grade")} />
        </Field>
        <Field label="Academic Year" required error={errors.academic_year?.message}>
          <Input {...register("academic_year")} />
        </Field>
        <Field label="Previous School">
          <Input {...register("previous_school")} />
        </Field>
        <Field label="Languages Spoken" full>
          <Input {...register("languages_spoken")} />
        </Field>
      </Section>

      <Section title="Parent / Guardian 1">
        <Field label="Full Name" required error={errors.parent1_full_name?.message}>
          <Input {...register("parent1_full_name")} />
        </Field>
        <Field label="Relationship" required error={errors.parent1_relationship?.message}>
          <Input {...register("parent1_relationship")} />
        </Field>
        <Field label="Phone" required error={errors.parent1_phone?.message}>
          <Input {...register("parent1_phone")} />
        </Field>
        <Field label="Email" required error={errors.parent1_email?.message}>
          <Input type="email" {...register("parent1_email")} />
        </Field>
        <Field label="Occupation" full>
          <Input {...register("parent1_occupation")} />
        </Field>
      </Section>

      <Section title="Parent / Guardian 2 (Optional)">
        <Field label="Full Name">
          <Input {...register("parent2_full_name")} />
        </Field>
        <Field label="Relationship">
          <Input {...register("parent2_relationship")} />
        </Field>
        <Field label="Phone">
          <Input {...register("parent2_phone")} />
        </Field>
        <Field label="Email" error={errors.parent2_email?.message}>
          <Input type="email" {...register("parent2_email")} />
        </Field>
      </Section>

      <Section title="Home Address">
        <Field label="Street Address" required full error={errors.home_address?.message}>
          <Input {...register("home_address")} />
        </Field>
        <Field label="City" required error={errors.city?.message}>
          <Input {...register("city")} />
        </Field>
      </Section>

      <Section title="Medical & Emergency">
        <Field label="Medical Conditions" required full error={errors.medical_conditions?.message}>
          <Textarea {...register("medical_conditions")} rows={3} />
        </Field>
        <Field label="Allergies" required full error={errors.allergies?.message}>
          <Textarea {...register("allergies")} rows={2} />
        </Field>
        <Field label="Emergency Contact Name" required error={errors.emergency_contact_name?.message}>
          <Input {...register("emergency_contact_name")} />
        </Field>
        <Field label="Emergency Contact Phone" required error={errors.emergency_contact_phone?.message}>
          <Input {...register("emergency_contact_phone")} />
        </Field>
        <Field label="Relationship to Child" required error={errors.emergency_contact_relationship?.message}>
          <Input {...register("emergency_contact_relationship")} />
        </Field>
      </Section>

      {/* Pickup persons */}
      <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-blue-900 dark:text-white text-base mb-4 pb-2 border-b border-slate-100 dark:border-white/10">Authorized to Pick Up Child</h2>
        <div className="space-y-4">
          {pickupFields.map((field, index) => (
            <div key={field.id} className="border border-slate-100 dark:border-white/10 rounded-lg p-4 bg-slate-50 dark:bg-white/3 relative">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Person {index + 1}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">Full Name <span className="text-red-500">*</span></Label>
                  <Input {...register(`pickup_persons.${index}.name`)} />
                  {errors.pickup_persons?.[index]?.name && <p className="text-red-500 text-xs mt-1">{errors.pickup_persons[index].name.message}</p>}
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">Relationship <span className="text-red-500">*</span></Label>
                  <Input {...register(`pickup_persons.${index}.relationship`)} />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">Phone <span className="text-red-500">*</span></Label>
                  <Input {...register(`pickup_persons.${index}.phone`)} />
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">Email</Label>
                  <Input type="email" {...register(`pickup_persons.${index}.email`)} />
                </div>
              </div>
              {index > 0 && (
                <button type="button" onClick={() => removePickup(index)} className="absolute top-3 right-3 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => addPickup({ name: "", relationship: "", phone: "", email: "" })} className="mt-3 text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add person
        </button>
      </div>

      {/* Photo Consent */}
      <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-blue-900 dark:text-white text-base mb-4 pb-2 border-b border-slate-100 dark:border-white/10">Photo Consent</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Social Media" required error={errors.consent_social_media?.message}>
            <select {...register("consent_social_media")} className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="given">Consent given</option>
              <option value="not_given">Consent not given</option>
            </select>
          </Field>
          <Field label="Posters & Advertisements" required error={errors.consent_marketing?.message}>
            <select {...register("consent_marketing")} className="w-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="given">Consent given</option>
              <option value="not_given">Consent not given</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Visit */}
      <div className="bg-white dark:bg-[#1a2035] rounded-xl border border-slate-200 dark:border-white/10 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-blue-900 dark:text-white text-base mb-4 pb-2 border-b border-slate-100 dark:border-white/10">School Visit</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Preferred Visit Date">
            <Input type="date" {...register("visit_date")} />
          </Field>
          <Field label="Preferred Time">
            <Input type="time" {...register("visit_time")} />
          </Field>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 mb-4 text-sm">{serverError}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="bg-blue-800 hover:bg-blue-900 text-white px-8">
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
