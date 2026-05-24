import type { TranscriptCourse } from "./types";

export type GradeEntry = {
  minScore: number;
  maxScore: number;
  gpa: number;
  qualification: string;
};

export const GRADE_SCALE: GradeEntry[] = [
  { minScore: 90, maxScore: 100, gpa: 4.0, qualification: "Outstanding" },
  { minScore: 80, maxScore: 89,  gpa: 3.5, qualification: "Excellent" },
  { minScore: 70, maxScore: 79,  gpa: 3.0, qualification: "Very Good" },
  { minScore: 60, maxScore: 69,  gpa: 2.5, qualification: "Good" },
  { minScore: 50, maxScore: 59,  gpa: 2.0, qualification: "Average" },
  { minScore: 40, maxScore: 49,  gpa: 1.5, qualification: "Below Average" },
  { minScore: 0,  maxScore: 39,  gpa: 1.0, qualification: "Fail" },
];

/** Convert a numeric score (0–100) to its GPA points. */
export function scoreToGpa(score: number): number {
  for (const entry of GRADE_SCALE) {
    if (score >= entry.minScore && score <= entry.maxScore) {
      return entry.gpa;
    }
  }
  return 1.0;
}

/** Convert a GPA value to its qualification string. */
export function gpaToQualification(gpa: number): string {
  // Find the closest entry
  for (const entry of GRADE_SCALE) {
    if (gpa >= entry.gpa) return entry.qualification;
  }
  return "Fail";
}

/**
 * The effective final grade for a course:
 * - final_avg if not null
 * - else half_year_avg if not null
 * - else null
 */
export function derivedFinal(course: Pick<TranscriptCourse, "final_avg" | "half_year_avg">): number | null {
  if (course.final_avg !== null && course.final_avg !== undefined) return course.final_avg;
  if (course.half_year_avg !== null && course.half_year_avg !== undefined) return course.half_year_avg;
  return null;
}

/**
 * Weighted GPA: sum(gpa(grade) * hours) / sum(hours)
 * Only courses with a grade (derivedFinal != null) are counted.
 * Returns null if no graded courses.
 */
export function calculateGpa(courses: Pick<TranscriptCourse, "final_avg" | "half_year_avg" | "teaching_hours">[]): number | null {
  let weightedSum = 0;
  let totalHours = 0;

  for (const course of courses) {
    const grade = derivedFinal(course);
    if (grade === null) continue;
    const hours = course.teaching_hours ?? 1;
    weightedSum += scoreToGpa(grade) * hours;
    totalHours += hours;
  }

  if (totalHours === 0) return null;
  return Math.round((weightedSum / totalHours) * 100) / 100;
}
