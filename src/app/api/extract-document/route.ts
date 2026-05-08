import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const STUDENT_PROMPT = `This is a child's passport or ID document. Extract the following fields and return ONLY a valid JSON object — no explanation, no markdown:
{
  "child_first_name": "first/given name only",
  "child_last_name": "family/surname only",
  "child_date_of_birth": "YYYY-MM-DD format",
  "child_gender": "male or female or other",
  "child_nationality": "nationality as plain text"
}
Use null for any field you cannot confidently read from the document.`;

const PARENT_PROMPT = `This is a parent or guardian's passport or ID document. Extract the following fields and return ONLY a valid JSON object — no explanation, no markdown:
{
  "parent1_full_name": "full name as written"
}
Use null for any field you cannot confidently read from the document.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) ?? "student";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type.startsWith("image/") ? file.type : "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUrl } },
            { type: "text", text: type === "student" ? STUDENT_PROMPT : PARENT_PROMPT },
          ],
        },
      ],
      max_tokens: 400,
    });

    const text = response.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ extracted: {} });

    const extracted = JSON.parse(jsonMatch[0]);
    const cleaned = Object.fromEntries(
      Object.entries(extracted).filter(([, v]) => v !== null && v !== "")
    );

    return NextResponse.json({ extracted: cleaned });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Extraction error:", msg);
    return NextResponse.json({ extracted: {}, extractionError: msg });
  }
}
