import { createAdminClient } from "@/lib/supabase/admin";

export const SETTING_DEFAULTS: Record<string, string> = {
  email_parent_subject: "Enrollment Application Received – Child Development Academy",
  email_parent_message:
    "Dear {parent_name},\n\nThank you for submitting an enrollment application for {child_name} (applying for {grade}).\n\nOur admissions team will review your application and get in touch within 3–5 business days.\n\nBest regards,\nChild Development Academy",
  email_admin_subject: "New Enrollment Application: {child_name}",
  enrollment_academic_years: "2025–2026,2026–2027",
};

export async function getSettings(keys?: string[]): Promise<Record<string, string>> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from("settings").select("key, value");
    if (keys) query = query.in("key", keys);
    const { data } = await query;
    const result = { ...SETTING_DEFAULTS };
    if (data) {
      for (const row of data) result[row.key] = row.value;
    }
    return result;
  } catch {
    return { ...SETTING_DEFAULTS };
  }
}

export async function upsertSettings(entries: Record<string, string>): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("settings").upsert(
    Object.entries(entries).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))
  );
}

export function applyVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
