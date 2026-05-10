"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { enrollmentSchema, EnrollmentFormData } from "@/lib/enrollment-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VISIT_CAPACITY = 3;

const VISIT_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 8; h <= 15; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
})();

function formatSlotTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function VisitSlotPicker({
  date,
  value,
  onChange,
}: {
  date: string;
  value: string | undefined;
  onChange: (time: string | undefined) => void;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) { setCounts({}); return; }
    setLoading(true);
    fetch(`/api/visit-slots?date=${date}`)
      .then((r) => r.json())
      .then(({ counts: c }) => setCounts(c ?? {}))
      .catch(() => setCounts({}))
      .finally(() => setLoading(false));
  }, [date]);

  if (!date) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 italic">
        Select a date above to see available time slots.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm py-2">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Checking availability…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
      {VISIT_SLOTS.map((slot) => {
        const booked = counts[slot] ?? 0;
        const isFull = booked >= VISIT_CAPACITY;
        const isSelected = value === slot;
        const spotsLeft = VISIT_CAPACITY - booked;

        return (
          <button
            key={slot}
            type="button"
            disabled={isFull}
            onClick={() => onChange(isSelected ? undefined : slot)}
            className={`flex flex-col items-center px-1 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 ${
              isSelected
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25"
                : isFull
                ? "bg-slate-50 dark:bg-white/3 border-slate-200 dark:border-white/8 text-slate-300 dark:text-white/20 cursor-not-allowed"
                : spotsLeft === 1
                ? "border-amber-200 dark:border-amber-500/30 text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300"
                : "border-slate-200 dark:border-white/12 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300"
            }`}
          >
            <span className="font-semibold">{formatSlotTime(slot)}</span>
            <span className={`text-[10px] mt-0.5 ${
              isSelected ? "text-blue-100"
              : isFull ? "text-slate-300 dark:text-white/20"
              : spotsLeft === 1 ? "text-amber-500 dark:text-amber-400"
              : "text-slate-400 dark:text-slate-500"
            }`}>
              {isFull ? "Full" : spotsLeft === VISIT_CAPACITY ? "Free" : `${spotsLeft} left`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const GRADES = [
  "Toddler (18–30 months)",
  "Nursery (30–42 months)",
  "Reception (42–54 months)",
  "Pre-KG (54–72 months)",
];

function getGradeFromDOB(dob: string): EnrollmentFormData["applying_for_grade"] | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months >= 18 && months < 30) return "Toddler (18–30 months)";
  if (months >= 30 && months < 42) return "Nursery (30–42 months)";
  if (months >= 42 && months < 54) return "Reception (42–54 months)";
  if (months >= 54 && months < 72) return "Pre-KG (54–72 months)";
  return null;
}

const ACADEMIC_YEARS = ["2025–2026", "2026–2027"];

function FileUpload({
  label,
  required,
  onChange,
  error,
  extracting,
}: {
  label: string;
  required?: boolean;
  onChange: (file: File | null) => void;
  error?: string;
  extracting?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    onChange(file);
    setFileName(file.name);
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  function handleClear() {
    onChange(null);
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {!fileName ? (
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
          <svg className="w-7 h-7 text-slate-400 dark:text-white/30 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm text-slate-500 dark:text-slate-400">Click to upload</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">JPG, PNG or PDF · max 5 MB</span>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleChange}
          />
        </label>
      ) : (
        <div className="relative flex items-center gap-3 border border-slate-200 dark:border-white/10 rounded-lg p-3 bg-slate-50 dark:bg-white/5">
          {preview ? (
            <Image src={preview} alt="preview" width={48} height={48} unoptimized className="w-12 h-12 object-cover rounded border border-slate-200 dark:border-white/10" />
          ) : (
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{fileName}</p>
            {extracting ? (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Extracting information…
              </p>
            ) : (
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Ready to upload</p>
            )}
          </div>
          {!extracting && (
            <button type="button" onClick={handleClear} className="text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-6 mb-5">
      <h2 className="text-base font-semibold text-slate-700 dark:text-white/90 border-b border-slate-200 dark:border-white/10 pb-3 mb-5">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  full,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function EnrollmentForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [parentPhoto, setParentPhoto] = useState<File | null>(null);
  const [student3x4Photo, setStudent3x4Photo] = useState<File | null>(null);
  const [pickupPhotos, setPickupPhotos] = useState<{ photo3x4: File | null; photoId: File | null }[]>([{ photo3x4: null, photoId: null }]);
  const [extractingStudent, setExtractingStudent] = useState(false);
  const [extractingParent, setExtractingParent] = useState(false);
  const [extractNote, setExtractNote] = useState("");
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      city: "Vientiane",
      pickup_persons: [{ name: "", relationship: "", phone: "", email: "" }],
    },
  });

  const { fields: pickupFields, append: addPickup, remove: removePickup } = useFieldArray({
    control,
    name: "pickup_persons",
  });

  const watchedDOB = watch("child_date_of_birth");
  const watchedVisitDate = watch("visit_date") ?? "";
  useEffect(() => {
    const grade = getGradeFromDOB(watchedDOB);
    if (grade) setValue("applying_for_grade", grade, { shouldValidate: true });
  }, [watchedDOB, setValue]);

  async function extractFromDocument(file: File, type: "student" | "parent") {
    const setExtracting = type === "student" ? setExtractingStudent : setExtractingParent;
    setExtracting(true);
    setExtractNote("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch("/api/extract-document", { method: "POST", body: fd });
      const json = await res.json();
      const { extracted, extractionError } = json;
      if (extractionError) { setExtractNote(`Error: ${extractionError}`); return; }
      const filled: string[] = [];
      if (type === "student") {
        if (extracted.child_first_name) { setValue("child_first_name", extracted.child_first_name); filled.push("first name"); }
        if (extracted.child_last_name) { setValue("child_last_name", extracted.child_last_name); filled.push("last name"); }
        if (extracted.child_date_of_birth) { setValue("child_date_of_birth", extracted.child_date_of_birth); filled.push("date of birth"); }
        if (extracted.child_gender) { setValue("child_gender", extracted.child_gender); filled.push("gender"); }
        if (extracted.child_nationality) { setValue("child_nationality", extracted.child_nationality); filled.push("nationality"); }
      } else {
        if (extracted.parent1_full_name) { setValue("parent1_full_name", extracted.parent1_full_name); filled.push("parent name"); }
      }
      setExtractNote(filled.length > 0 ? `Auto-filled: ${filled.join(", ")}.` : "Could not read document — please fill in manually.");
    } catch {
      setExtractNote("Could not read document — please fill in manually.");
    } finally {
      setExtracting(false);
    }
  }

  function handleStudentPhotoChange(file: File | null) {
    setStudentPhoto(file);
    if (file) extractFromDocument(file, "student");
  }

  function handleParentPhotoChange(file: File | null) {
    setParentPhoto(file);
    if (file) extractFromDocument(file, "parent");
  }

  async function onSubmit(data: EnrollmentFormData) {
    setServerError("");

    // Validate required files
    const errors: Record<string, string> = {};
    if (!student3x4Photo) errors.student_3x4 = "Student 3×4 photo is required";
    pickupPhotos.forEach(({ photo3x4, photoId }, i) => {
      if (!photo3x4) errors[`pickup_3x4_${i}`] = "3×4 photo is required";
      if (!photoId) errors[`pickup_id_${i}`] = "ID / Passport photo is required";
    });
    if (Object.keys(errors).length > 0) {
      setFileErrors(errors);
      return;
    }
    setFileErrors({});

    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v == null) return;
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      });
      if (studentPhoto) fd.append("student_photo", studentPhoto);
      if (parentPhoto) fd.append("parent_photo", parentPhoto);
      if (student3x4Photo) fd.append("student_3x4_photo", student3x4Photo);
      pickupPhotos.forEach(({ photo3x4, photoId }, i) => {
        if (photo3x4) fd.append(`pickup_3x4_photo_${i}`, photo3x4);
        if (photoId) fd.append(`pickup_id_photo_${i}`, photoId);
      });

      const res = await fetch("/api/enroll", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again or contact the school."
      );
    }
  }

  function handleRegisterAnother() {
    setSubmitted(false);
    setServerError("");
    setStudentPhoto(null);
    setParentPhoto(null);
    setStudent3x4Photo(null);
    setPickupPhotos([{ photo3x4: null, photoId: null }]);
    setExtractNote("");
    setFileErrors({});
    reset();
  }

  if (submitted) {
    return (
      <div className="glass p-10 text-center" style={{ borderColor: "rgba(134,239,172,0.3)" }}>
        <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Application Submitted!</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Thank you! Your enrollment application has been received. A confirmation email has been
          sent to you. Our admissions team will be in touch within <strong>3–5 business days</strong>.
        </p>
        <button
          type="button"
          onClick={handleRegisterAnother}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Register Another Student
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Documents — top so extraction fills fields below */}
      <div className="glass p-6 mb-5">
        <h2 className="text-base font-semibold text-slate-700 dark:text-white/90 border-b border-slate-200 dark:border-white/10 pb-3 mb-2">
          Documents
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Upload ID or passport photos — we&apos;ll automatically fill in the form fields below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileUpload
            label="Student ID / Passport Photo"
            required
            onChange={(file) => { handleStudentPhotoChange(file); if (file) setFileErrors((p) => { const n={...p}; delete n.student_photo; return n; }); }}
            extracting={extractingStudent}
            error={fileErrors.student_photo}
          />
          <FileUpload
            label="Parent / Guardian ID / Passport Photo"
            onChange={handleParentPhotoChange}
            extracting={extractingParent}
          />
        </div>
        {extractNote && (
          <p className={`text-xs mt-3 ${extractNote.startsWith("Auto") ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"}`}>
            {extractNote}
          </p>
        )}
      </div>

      {/* Child Information */}
      <FormSection title="Child Information">
        <Field label="First Name" error={errors.child_first_name?.message} required>
          <Input {...register("child_first_name")} placeholder="First name" />
        </Field>
        <Field label="Last Name" error={errors.child_last_name?.message} required>
          <Input {...register("child_last_name")} placeholder="Last name" />
        </Field>
        <Field label="Date of Birth" error={errors.child_date_of_birth?.message} required>
          <Input type="date" {...register("child_date_of_birth")} />
        </Field>
        <Field label="Gender" error={errors.child_gender?.message} required>
          <Controller
            name="child_gender"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Nationality" error={errors.child_nationality?.message} required>
          <Input {...register("child_nationality")} placeholder="e.g. Lao, Thai, American" />
        </Field>
        <div>
          <Label className="text-slate-700 font-medium mb-1 block">
            Applying for Grade <span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            name="applying_for_grade"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {watchedDOB && (() => {
            const birth = new Date(watchedDOB);
            if (isNaN(birth.getTime())) return null;
            const now = new Date();
            const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
            const detected = getGradeFromDOB(watchedDOB);
            return detected ? (
              <div className="mt-2 flex items-start gap-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 rounded-lg px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Your child is <strong>{months} months old</strong> — automatically placed in <strong>{detected.split(" ")[0]}</strong>. You may select a different class above if needed.
                </span>
              </div>
            ) : (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>
                  Your child is <strong>{months} months old</strong>. This age is outside our current enrollment range (18–72 months). Please select a class manually or contact us.
                </span>
              </div>
            );
          })()}
          {errors.applying_for_grade && (
            <p className="text-red-500 text-xs mt-1">{errors.applying_for_grade.message}</p>
          )}
        </div>
        <Field label="Academic Year" error={errors.academic_year?.message} required>
          <Controller
            name="academic_year"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => field.onChange(v ?? "")}
              >
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Previous School">
          <Input {...register("previous_school")} placeholder="Name of previous school (if any)" />
        </Field>
        <Field label="Languages Spoken at Home" full>
          <Input {...register("languages_spoken")} placeholder="e.g. Lao, English, Thai" />
        </Field>
        <div className="sm:col-span-2">
          <FileUpload
            label="Student 3×4 Portrait Photo"
            required
            onChange={(file) => {
              setStudent3x4Photo(file);
              if (file) setFileErrors((p) => { const n = { ...p }; delete n.student_3x4; return n; });
            }}
            error={fileErrors.student_3x4}
          />
        </div>
      </FormSection>

      {/* Parent / Guardian 1 */}
      <FormSection title="Parent / Guardian 1">
        <Field label="Full Name" error={errors.parent1_full_name?.message} required>
          <Input {...register("parent1_full_name")} placeholder="Full name" />
        </Field>
        <Field label="Relationship to Child" error={errors.parent1_relationship?.message} required>
          <Input {...register("parent1_relationship")} placeholder="e.g. Mother, Father, Guardian" />
        </Field>
        <Field label="Phone Number" error={errors.parent1_phone?.message} required>
          <Input {...register("parent1_phone")} placeholder="+856 xx xxx xxxx" />
        </Field>
        <Field label="Email Address" error={errors.parent1_email?.message} required>
          <Input type="email" {...register("parent1_email")} placeholder="email@example.com" />
        </Field>
        <Field label="Occupation" full>
          <Input {...register("parent1_occupation")} placeholder="e.g. Teacher, Business owner" />
        </Field>
      </FormSection>

      {/* Parent / Guardian 2 */}
      <FormSection title="Parent / Guardian 2 (Optional)">
        <Field label="Full Name">
          <Input {...register("parent2_full_name")} placeholder="Full name" />
        </Field>
        <Field label="Relationship to Child">
          <Input {...register("parent2_relationship")} placeholder="e.g. Mother, Father" />
        </Field>
        <Field label="Phone Number">
          <Input {...register("parent2_phone")} placeholder="+856 xx xxx xxxx" />
        </Field>
        <Field label="Email Address" error={errors.parent2_email?.message}>
          <Input type="email" {...register("parent2_email")} placeholder="email@example.com" />
        </Field>
      </FormSection>

      {/* Address */}
      <FormSection title="Home Address">
        <Field label="Street Address" error={errors.home_address?.message} required full>
          <Input {...register("home_address")} placeholder="Village, Street, District" />
        </Field>
        <Field label="City" error={errors.city?.message} required>
          <Input {...register("city")} placeholder="City" />
        </Field>
      </FormSection>

      {/* Authorized Pickup */}
      <div className="glass p-6 mb-5">
        <h2 className="text-base font-semibold text-slate-700 dark:text-white/90 border-b border-slate-200 dark:border-white/10 pb-3 mb-5">
          Authorized to Pick Up Child
        </h2>
        <div className="space-y-4">
          {pickupFields.map((field, index) => (
            <div key={field.id} className="glass-sm p-4 relative">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Person {index + 1}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register(`pickup_persons.${index}.name`)}
                    placeholder="Full name"
                  />
                  {errors.pickup_persons?.[index]?.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.pickup_persons[index].name.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                    Relationship <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register(`pickup_persons.${index}.relationship`)}
                    placeholder="e.g. Mother, Uncle, Nanny"
                  />
                  {errors.pickup_persons?.[index]?.relationship && (
                    <p className="text-red-500 text-xs mt-1">{errors.pickup_persons[index].relationship.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register(`pickup_persons.${index}.phone`)}
                    placeholder="+856 xx xxx xxxx"
                  />
                  {errors.pickup_persons?.[index]?.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.pickup_persons[index].phone.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-300 font-medium mb-1 block">Email</Label>
                  <Input
                    type="email"
                    {...register(`pickup_persons.${index}.email`)}
                    placeholder="email@example.com (optional)"
                  />
                  {errors.pickup_persons?.[index]?.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.pickup_persons[index].email.message}</p>
                  )}
                </div>
              </div>
              {/* Pickup person photos */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 col-span-full">
                <FileUpload
                  label="3×4 Portrait Photo"
                  required
                  onChange={(file) => {
                    setPickupPhotos((prev) => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], photo3x4: file };
                      return updated;
                    });
                    if (file) setFileErrors((prev) => { const n = { ...prev }; delete n[`pickup_3x4_${index}`]; return n; });
                  }}
                  error={fileErrors[`pickup_3x4_${index}`]}
                />
                <FileUpload
                  label="ID / Passport Photo"
                  required
                  onChange={(file) => {
                    setPickupPhotos((prev) => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], photoId: file };
                      return updated;
                    });
                    if (file) setFileErrors((prev) => { const n = { ...prev }; delete n[`pickup_id_${index}`]; return n; });
                  }}
                  error={fileErrors[`pickup_id_${index}`]}
                />
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => { removePickup(index); setPickupPhotos((p) => p.filter((_, i) => i !== index)); }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.pickup_persons?.root && (
          <p className="text-red-500 text-xs mt-2">{errors.pickup_persons.root.message}</p>
        )}
        <button
          type="button"
          onClick={() => { addPickup({ name: "", relationship: "", phone: "", email: "" }); setPickupPhotos((p) => [...p, { photo3x4: null, photoId: null }]); }}
          className="mt-4 flex items-center gap-2 text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add another person
        </button>
      </div>

      {/* Medical & Emergency */}
      <FormSection title="Medical & Emergency Information">
        <Field label="Medical Conditions" error={errors.medical_conditions?.message} required full>
          <Textarea
            {...register("medical_conditions")}
            placeholder="List any medical conditions, disabilities, or special needs (write 'None' if not applicable)"
            rows={3}
          />
        </Field>
        <Field label="Allergies" error={errors.allergies?.message} required full>
          <Textarea
            {...register("allergies")}
            placeholder="List any food or medication allergies (write 'None' if not applicable)"
            rows={2}
          />
        </Field>
        <Field label="Emergency Contact Name" error={errors.emergency_contact_name?.message} required>
          <Input {...register("emergency_contact_name")} placeholder="Full name" />
        </Field>
        <Field label="Emergency Contact Phone" error={errors.emergency_contact_phone?.message} required>
          <Input {...register("emergency_contact_phone")} placeholder="+856 xx xxx xxxx" />
        </Field>
        <Field label="Relationship to Child" error={errors.emergency_contact_relationship?.message} required>
          <Input {...register("emergency_contact_relationship")} placeholder="e.g. Aunt, Grandmother" />
        </Field>
      </FormSection>

      {/* Consent */}
      <div className="glass p-6 mb-5">
        <h2 className="text-base font-semibold text-slate-700 dark:text-white/90 border-b border-slate-200 dark:border-white/10 pb-3 mb-5">
          Photo Consent
        </h2>
        <div className="space-y-5">
          {/* Social media */}
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              I give consent to use my child&apos;s photo(s) on the school&apos;s <strong>social media</strong>.
              <span className="text-red-500 ml-1">*</span>
            </p>
            <Controller
              name="consent_social_media"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => field.onChange("given")}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      field.value === "given"
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-400 hover:border-green-400 dark:hover:border-green-500 hover:text-green-700 dark:hover:text-green-400"
                    }`}
                  >
                    I give consent
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange("not_given")}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      field.value === "not_given"
                        ? "bg-red-500 border-red-500 text-white"
                        : "border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-400 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400"
                    }`}
                  >
                    I do not give consent
                  </button>
                </div>
              )}
            />
            {errors.consent_social_media && (
              <p className="text-red-500 text-xs mt-1">{errors.consent_social_media.message}</p>
            )}
          </div>

          {/* Marketing */}
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
              I give consent to use my child&apos;s photo(s) on school <strong>posters and advertisements</strong>.
              <span className="text-red-500 ml-1">*</span>
            </p>
            <Controller
              name="consent_marketing"
              control={control}
              render={({ field }) => (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => field.onChange("given")}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      field.value === "given"
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-400 hover:border-green-400 dark:hover:border-green-500 hover:text-green-700 dark:hover:text-green-400"
                    }`}
                  >
                    I give consent
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange("not_given")}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      field.value === "not_given"
                        ? "bg-red-500 border-red-500 text-white"
                        : "border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-400 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400"
                    }`}
                  >
                    I do not give consent
                  </button>
                </div>
              )}
            />
            {errors.consent_marketing && (
              <p className="text-red-500 text-xs mt-1">{errors.consent_marketing.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Book a Visit */}
      <div className="glass p-6 mb-5">
        <h2 className="text-base font-semibold text-slate-700 dark:text-white/90 border-b border-slate-200 dark:border-white/10 pb-3 mb-5">
          Book a Date to Visit the School
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Optional — you are welcome to visit our campus before enrollment. Select a preferred date and time and our team will confirm the appointment.
        </p>
        <div className="space-y-4">
          <Field label="Preferred Visit Date">
            <Input type="date" {...register("visit_date")} min={new Date().toISOString().split("T")[0]} />
          </Field>
          <div>
            <Label className="text-slate-700 dark:text-slate-300 font-medium mb-2 block">
              Preferred Visit Time
            </Label>
            <Controller
              name="visit_time"
              control={control}
              render={({ field }) => (
                <VisitSlotPicker
                  date={watchedVisitDate}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-white text-base font-semibold py-6"
        style={{ background: "rgba(0,90,220,0.88)", backdropFilter: "blur(10px)", border: "1px solid rgba(100,160,255,0.3)", boxShadow: "0 2px 20px rgba(0,90,220,0.28), inset 0 1px 0 rgba(255,255,255,0.2)" }}
      >
        {isSubmitting ? "Submitting Application…" : "Submit Enrollment Application"}
      </Button>

      <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-3">
        By submitting, you agree that the information provided is accurate and complete.
      </p>
    </form>
  );
}
