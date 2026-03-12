/**
 * Utility functions for IELTS band score colours and date formatting.
 * Imported as "@/utils/bandColor" across screens.
 */

import { Colors } from "@/constants/theme";

/**
 * Returns a colour string matching the IELTS band score range.
 *   >= 7.0  → green (good)
 *   >= 6.0  → amber/warning (average)
 *   <  6.0  → red (needs improvement)
 */
export function getBandColor(score: number): string {
  if (score >= 7.0) return Colors.success;
  if (score >= 6.0) return Colors.warning;
  return Colors.error;
}

/**
 * Returns the IELTS band label for a given score.
 * Example: 7.5 → "Good", 5.5 → "Limited"
 */
export function getBandLabel(score: number): string {
  if (score >= 8.5) return "Excellent";
  if (score >= 7.5) return "Good";
  if (score >= 6.5) return "Competent";
  if (score >= 5.5) return "Modest";
  if (score >= 4.5) return "Limited";
  return "Very Limited";
}

/**
 * Formats an ISO date string to a human-readable short date.
 * Example: "2024-03-11T10:30:00Z" → "11 Mar 2024"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
