import { differenceInDays, addDays, format } from "date-fns";

/**
 * Calculate EDD (Expected Date of Delivery) from LMP
 * Naegele's Rule: EDD = LMP + 280 days (40 weeks)
 */
export function calculateEDD(lmpDate: Date): Date {
  return addDays(lmpDate, 280);
}

/**
 * Calculate gestational age in weeks and days from LMP
 */
export function calculateGestationalAge(lmpDate: Date, referenceDate: Date = new Date()): { weeks: number; days: number; totalDays: number } {
  const totalDays = differenceInDays(referenceDate, lmpDate);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, totalDays };
}

/**
 * Format gestational age as readable string
 */
export function formatGestationalAge(weeks: number, days: number): string {
  if (weeks === 0 && days === 0) return "0 days";
  if (weeks === 0) return `${days} day${days !== 1 ? 's' : ''}`;
  if (days === 0) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  return `${weeks}w ${days}d`;
}

/**
 * Calculate days remaining until delivery
 */
export function calculateDaysToDelivery(eddDate: Date, referenceDate: Date = new Date()): number {
  return differenceInDays(eddDate, referenceDate);
}

/**
 * Get trimester based on gestational age
 */
export function getTrimester(weeks: number): { trimester: number; label: string } {
  if (weeks < 14) return { trimester: 1, label: "First Trimester" };
  if (weeks < 28) return { trimester: 2, label: "Second Trimester" };
  return { trimester: 3, label: "Third Trimester" };
}

/**
 * Blood group options
 */
export const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Genotype options
 */
export const genotypeOptions = ["AA", "AS", "SS", "AC", "SC"];

/**
 * Fetal presentation options
 */
export const fetalPresentationOptions = ["Cephalic", "Breech", "Transverse", "Oblique"];

/**
 * HIV status options
 */
export const hivStatusOptions = ["Negative", "Positive", "Unknown"];

/**
 * Get color status for fetal heart rate
 */
export function getFetalHeartRateStatus(fhr: number): { status: "normal" | "warning" | "critical"; label: string } {
  if (fhr < 110) return { status: "critical", label: "Bradycardia" };
  if (fhr > 160) return { status: "critical", label: "Tachycardia" };
  if (fhr < 120 || fhr > 150) return { status: "warning", label: "Borderline" };
  return { status: "normal", label: "Normal" };
}

/**
 * Get color status for fundal height (should roughly match weeks)
 */
export function getFundalHeightStatus(fundalHeight: number, weeks: number): { status: "normal" | "warning" | "critical"; label: string } {
  const difference = Math.abs(fundalHeight - weeks);
  if (difference <= 2) return { status: "normal", label: "Normal" };
  if (difference <= 4) return { status: "warning", label: "Check" };
  return { status: "critical", label: "Review" };
}
