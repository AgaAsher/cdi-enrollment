import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

// GET /api/admin/attendance/export?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) return NextResponse.json({ error: "Missing from/to" }, { status: 400 });

  const supabase = createAdminClient();

  // Fetch all attendance records in range (both teacher-slot and admin-daily)
  const { data: rows, error } = await supabase
    .from("attendance")
    .select("date, class_label, subject, slot_time, teacher_name, records")
    .gte("date", from)
    .lte("date", to)
    .order("date")
    .order("class_label");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type AttRecord = { student_id: string; student_name: string; status: string };
  type Row = { date: string; class_label: string; subject: string; slot_time: string; teacher_name: string; records: AttRecord[] };

  const data = (rows ?? []) as Row[];

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summaryData: Record<string, string | number>[] = [];
  for (const row of data) {
    const records: AttRecord[] = Array.isArray(row.records) ? row.records : [];
    const present  = records.filter((r) => r.status === "present").length;
    const late     = records.filter((r) => r.status === "late").length;
    const absent   = records.filter((r) => r.status === "absent").length;
    const total    = records.length;
    summaryData.push({
      Date: row.date,
      Class: row.class_label,
      Session: row.subject === "daily" ? "Daily" : `${row.subject} (${row.slot_time})`,
      Teacher: row.teacher_name,
      Total: total,
      Present: present,
      Late: late,
      Absent: absent,
      "% Present": total > 0 ? `${Math.round(((present + late) / total) * 100)}%` : "—",
    });
  }

  // ── Sheet 2: Detail ───────────────────────────────────────────────────────
  const detailData: Record<string, string>[] = [];
  for (const row of data) {
    const records: AttRecord[] = Array.isArray(row.records) ? row.records : [];
    for (const r of records) {
      detailData.push({
        Date: row.date,
        Class: row.class_label,
        Session: row.subject === "daily" ? "Daily" : `${row.subject} (${row.slot_time})`,
        Teacher: row.teacher_name,
        "Student Name": r.student_name,
        Status: r.status.charAt(0).toUpperCase() + r.status.slice(1),
      });
    }
  }

  // Build workbook
  const wb = XLSX.utils.book_new();

  if (summaryData.length === 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No attendance data found for this period."]]), "Summary");
  } else {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");
    if (detailData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailData), "Detail");
    }
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `attendance_${from}_to_${to}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
