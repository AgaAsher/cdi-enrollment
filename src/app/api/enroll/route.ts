import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrollmentSchema } from "@/lib/enrollment-schema";
import { adminNotificationEmail, parentConfirmationEmail } from "@/lib/email-templates";
import { rateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp",
  "application/pdf",
]);
const MAX_UPLOAD_SIZE = 8 * 1024 * 1024; // 8 MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

async function uploadFile(supabase: ReturnType<typeof createAdminClient>, file: File, prefix: string) {
  if (file.size > MAX_UPLOAD_SIZE) return null;
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) return null;
  const ext = EXT_BY_TYPE[file.type] ?? "bin";
  const path = `${prefix}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from("enrollment-docs").upload(path, bytes, { contentType: file.type });
  return error ? null : path;
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, "enroll", { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please contact us directly if you need help." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  try {
    const formData = await req.formData();

    const fields: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value !== "string") continue;
      if (key === "pickup_persons") {
        try { fields[key] = JSON.parse(value); } catch { fields[key] = []; }
      } else {
        fields[key] = value;
      }
    }

    const parsed = enrollmentSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = createAdminClient();

    // Check visit slot capacity before proceeding
    if (data.visit_date && data.visit_time) {
      const { count } = await supabase
        .from("enrollments")
        .select("id", { count: "exact", head: true })
        .eq("visit_date", data.visit_date)
        .eq("visit_time", data.visit_time);

      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          { error: "This time slot is fully booked. Please choose a different time." },
          { status: 409 }
        );
      }
    }

    // Ensure storage bucket exists
    await supabase.storage.createBucket("enrollment-docs", { public: false });

    const studentPhoto = formData.get("student_photo") as File | null;
    const parentPhoto = formData.get("parent_photo") as File | null;
    const student3x4Photo = formData.get("student_3x4_photo") as File | null;

    const studentPhotoPath = studentPhoto?.size ? await uploadFile(supabase, studentPhoto, "student") : null;
    const parentPhotoPath = parentPhoto?.size ? await uploadFile(supabase, parentPhoto, "parent") : null;
    const student3x4Path = student3x4Photo?.size ? await uploadFile(supabase, student3x4Photo, "student-3x4") : null;

    // Upload pickup person photos and attach paths
    const pickupPersons: Record<string, unknown>[] = Array.isArray(data.pickup_persons) ? [...data.pickup_persons] : [];
    for (let i = 0; i < pickupPersons.length; i++) {
      const photo3x4File = formData.get(`pickup_3x4_photo_${i}`) as File | null;
      const photoIdFile = formData.get(`pickup_id_photo_${i}`) as File | null;
      if (photo3x4File?.size) {
        const path = await uploadFile(supabase, photo3x4File, `pickup-3x4-${i}`);
        if (path) pickupPersons[i] = { ...pickupPersons[i], photo_3x4_path: path };
      }
      if (photoIdFile?.size) {
        const path = await uploadFile(supabase, photoIdFile, `pickup-id-${i}`);
        if (path) pickupPersons[i] = { ...pickupPersons[i], photo_id_path: path };
      }
    }

    const { error } = await supabase.from("enrollments").insert({
      ...data,
      pickup_persons: pickupPersons,
      parent2_email: data.parent2_email || null,
      student_photo_path: studentPhotoPath,
      parent_photo_path: parentPhotoPath,
      student_3x4_path: student3x4Path,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Could not save your application. Please try again." }, { status: 500 });
    }

    // Send confirmation to parent
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: `CDI School <${process.env.EMAIL_FROM}>`,
        to: data.parent1_email,
        subject: "Enrollment Application Received – CDI International School of Laos",
        html: parentConfirmationEmail(data.child_first_name, data.child_last_name, data.applying_for_grade),
      });

      // Notify admin
      if (process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: `CDI School <${process.env.EMAIL_FROM}>`,
          to: process.env.ADMIN_EMAIL,
          subject: `New Enrollment: ${data.child_first_name} ${data.child_last_name}`,
          html: adminNotificationEmail(data),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Enrollment error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
