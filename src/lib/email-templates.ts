function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parentConfirmationEmail(firstName: string, lastName: string, grade: string, customMessage?: string): string {
  const adminEmail = process.env.ADMIN_EMAIL ?? "info.cda@isl.edu.la";
  const messageHtml = customMessage
    ? customMessage.split("\n").map((l) => l.trim() ? `<p style="color:#475569">${escapeHtml(l)}</p>` : "<br/>").join("")
    : `<p style="color: #475569;">Thank you for submitting an enrollment application for:</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <strong style="color: #1e293b;">${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong><br/>
          <span style="color: #64748b;">Applying for: ${escapeHtml(grade)}</span>
        </div>
        <p style="color: #475569;">Our admissions team will review your application and contact you within <strong>3–5 business days</strong>.</p>`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #1e40af; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Child Development Academy</h1>
        <p style="color: #bfdbfe; margin: 4px 0 0;">International School of Laos</p>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b;">Application Received!</h2>
        ${messageHtml}
        <p style="color: #475569;">If you have any questions, please contact us at:</p>
        <p style="color: #1e40af;"><a href="mailto:${escapeHtml(adminEmail)}">${escapeHtml(adminEmail)}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          Child Development Academy – International School of Laos<br/>Vientiane, Laos PDR
        </p>
      </div>
    </div>
  `;
}

type AdminEmailFields = {
  child_first_name: string;
  child_last_name: string;
  child_date_of_birth: string;
  applying_for_grade: string;
  parent1_full_name: string;
  parent1_email: string;
  parent1_phone: string;
};

export function adminNotificationEmail(data: AdminEmailFields): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://isl-cda.com";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1e40af;">New Enrollment Application</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; color: #64748b;">Child Name</td><td style="padding: 8px; font-weight: bold;">${escapeHtml(data.child_first_name)} ${escapeHtml(data.child_last_name)}</td></tr>
        <tr style="background:#f8fafc"><td style="padding: 8px; color: #64748b;">Date of Birth</td><td style="padding: 8px;">${escapeHtml(data.child_date_of_birth)}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Applying For</td><td style="padding: 8px;">${escapeHtml(data.applying_for_grade)}</td></tr>
        <tr style="background:#f8fafc"><td style="padding: 8px; color: #64748b;">Parent</td><td style="padding: 8px;">${escapeHtml(data.parent1_full_name)}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Parent Email</td><td style="padding: 8px;">${escapeHtml(data.parent1_email)}</td></tr>
        <tr style="background:#f8fafc"><td style="padding: 8px; color: #64748b;">Parent Phone</td><td style="padding: 8px;">${escapeHtml(data.parent1_phone)}</td></tr>
      </table>
      <p style="margin-top: 24px;"><a href="${appUrl}/admin" style="background: #1e40af; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Dashboard</a></p>
    </div>
  `;
}
