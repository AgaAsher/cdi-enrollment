import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";

const MEALS = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack"];
const DAYS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = [
    ["Meal", ...DAYS],
    ...MEALS.map(meal => [meal, "", "", "", "", ""]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 18 },
    ...DAYS.map(() => ({ wch: 22 })),
  ];

  // Bold header row
  const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "0F1F6B" } }, font2: { color: { rgb: "FFFFFF" } } };
  ["A1","B1","C1","D1","E1","F1"].forEach(ref => {
    if (ws[ref]) ws[ref].s = headerStyle;
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Weekly Menu");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="weekly_menu_sample.xlsx"',
    },
  });
}
