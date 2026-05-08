import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrollmentSchema } from "@/lib/enrollment-schema";
import { Resend } from "resend";

async function uploadFile(supabase: ReturnType<typeof createAdminClient>, file: File, prefix: string) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${prefix}-${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from("enrollment-docs").upload(path, bytes, { contentType: file.type });
  return error ? null : path;
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Enrollment error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parentConfirmationEmail(firstName: string, lastName: string, grade: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #1e40af; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Child Development Academy</h1>
        <p style="color: #bfdbfe; margin: 4px 0 0;">International School of Laos</p>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b;">Application Received!</h2>
        <p style="color: #475569;">Thank you for submitting an enrollment application for:</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <strong style="color: #1e293b;">${firstName} ${lastName}</strong><br/>
          <span style="color: #64748b;">Applying for: ${grade}</span>
        </div>
        <p style="color: #475569;">Our admissions team will review your application and contact you within <strong>3–5 business days</strong>.</p>
        <p style="color: #475569;">If you have any questions, please contact us at:</p>
        <p style="color: #1e40af;"><a href="mailto:${process.env.ADMIN_EMAIL}">${process.env.ADMIN_EMAIL}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Child Development Academy – International School of Laos<br/>Vientiane, Laos PDR
        </p>
      </div>
    </div>
  `;
}

function adminNotificationEmail(data: Record<string, unknown>) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e40af;">New Enrollment Application</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; color: #64748b;">Child Name</td><td style="padding: 8px; font-weight: bold;">${data.child_first_name} ${data.child_last_name}</td></tr>
        <tr style="background:#f8fafc"><td style="padding: 8px; color: #64748b;">Date of Birth</td><td style="padding: 8px;">${data.child_date_of_birth}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Applying For</td><td style="padding: 8px;">${data.applying_for_grade}</td></tr>
        <tr style="background:#f8fafc"><td style="padding: 8px; color: #64748b;">Parent</td><td style="padding: 8px;">${data.parent1_full_name}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Parent Email</td><td style="padding: 8px;">${data.parent1_email}</td></tr>
        <tr style="background:#f8fafc"><td style="padding: 8px; color: #64748b;">Parent Phone</td><td style="padding: 8px;">${data.parent1_phone}</td></tr>
      </table>
      <p style="margin-top: 24px;"><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" style="background: #1e40af; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Dashboard</a></p>
    </div>
  `;
}
