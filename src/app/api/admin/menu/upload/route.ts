import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import * as XLSX from "xlsx";

const MEALS = ["Breakfast", "Morning Snack", "Lunch", "Afternoon Snack"];
const DAYS  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const p = session.permissions ?? {};
  if (!p.menu_edit && session.role !== "admin" && session.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];

  // Parse: row 0 = headers [Meal, Mon, Tue, Wed, Thu, Fri]
  // rows 1+ = [mealName, mon_val, tue_val, ...]
  const headerRow = rows[0] ?? [];
  const dayIndices: number[] = [];

  for (const day of DAYS) {
    const idx = headerRow.findIndex(h =>
      typeof h === "string" && h.toLowerCase().startsWith(day.toLowerCase().slice(0, 3))
    );
    dayIndices.push(idx);
  }

  const menu_data: Record<string, Record<string, string>> = {};
  for (const day of DAYS) menu_data[day] = {};

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row[0]) continue;
    const mealName = String(row[0]).trim();
    if (!MEALS.some(m => m.toLowerCase() === mealName.toLowerCase())) continue;
    const canonicalMeal = MEALS.find(m => m.toLowerCase() === mealName.toLowerCase())!;

    DAYS.forEach((day, di) => {
      const colIdx = dayIndices[di];
      const val = colIdx >= 0 ? (row[colIdx] ?? "") : "";
      menu_data[day][canonicalMeal] = String(val).trim();
    });
  }

  return NextResponse.json({ menu_data });
}
