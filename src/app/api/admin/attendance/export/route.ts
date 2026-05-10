import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

const CLASSES = [
  "Toddler (18–30 months)",
  "Nursery (30–42 months)",
  "Reception (42–54 months)",
  "Pre-KG (54–72 months)",
];

// Generate every calendar date between from and to inclusive
function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (cur <= end) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// GET /api/admin/attendance/export?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to   = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "Missing from/to" }, { status: 400 });

  const supabase = createAdminClient();

  // All attendance rows in the date range
  const { data: rows, error } = await supabase
    .from("attendance")
    .select("date, class_label, records")
    .gte("date", from)
    .lte("date", to)
    .order("date");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type AttRecord = { student_id: string; student_name: string; status: string };
  type Row      = { date: string; class_label: string; records: AttRecord[] };

  const data = (rows ?? []) as Row[];

  // Index: classLabel → date → studentId → status
  const index = new Map<string, Map<string, Map<string, string>>>();
  // Also collect all student names seen per class
  const studentNames = new Map<string, Map<string, string>>(); // classLabel → id → name

  for (const row of data) {
    if (!index.has(row.class_label)) index.set(row.class_label, new Map());
    if (!studentNames.has(row.class_label)) studentNames.set(row.class_label, new Map());
    const byDate = index.get(row.class_label)!;
    const names  = studentNames.get(row.class_label)!;
    const byId   = new Map<string, string>();
    for (const r of (row.records ?? []) as AttRecord[]) {
      byId.set(r.student_id, r.status);
      names.set(r.student_id, r.student_name);
    }
    byDate.set(row.date, byId);
  }

  const dates = dateRange(from, to);
  const wb = XLSX.utils.book_new();

  // One sheet per class
  for (const cls of CLASSES) {
    const byDate = index.get(cls);
    const names  = studentNames.get(cls);

    if (!names || names.size === 0) {
      // No data for this class — add an empty placeholder sheet
      const ws = XLSX.utils.aoa_to_sheet([["No attendance data recorded for this class in the selected period."]]);
      XLSX.utils.book_append_sheet(wb, ws, cls.split(" ")[0]);
      continue;
    }

    // Build header row: ["Student Name", date1, date2, ...]
    const header = ["Student Name", ...dates];

    // One row per student
    const studentIds = [...names.keys()].sort((a, b) =>
      (names.get(a) ?? "").localeCompare(names.get(b) ?? "")
    );

    const sheetRows: (string | number)[][] = [header];
    const presentCounts: number[] = new Array(dates.length).fill(0);
    const absentCounts:  number[] = new Array(dates.length).fill(0);

    for (const sid of studentIds) {
      const name = names.get(sid) ?? sid;
      const row: (string | number)[] = [name];
      dates.forEach((d, di) => {
        const status = byDate?.get(d)?.get(sid) ?? "";
        let cell = "";
        if (status === "present")  { cell = "P"; presentCounts[di]++; }
        else if (status === "late") { cell = "L"; presentCounts[di]++; }
        else if (status === "absent") { cell = "A"; absentCounts[di]++; }
        row.push(cell);
      });
      sheetRows.push(row);
    }

    // Summary row
    const summaryPresent: (string | number)[] = ["Present"];
    const summaryAbsent:  (string | number)[] = ["Absent"];
    dates.forEach((_, di) => {
      summaryPresent.push(presentCounts[di]);
      summaryAbsent.push(absentCounts[di]);
    });
    sheetRows.push([], summaryPresent, summaryAbsent);

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);

    // Column widths
    ws["!cols"] = [{ wch: 24 }, ...dates.map(() => ({ wch: 12 }))];

    const sheetName = cls.split(" ")[0]; // "Toddler", "Nursery", etc.
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
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
