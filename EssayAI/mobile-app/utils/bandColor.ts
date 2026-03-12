import { Colors } from "@/constants/theme"

export const getBandColor = (score: number): string => {
  if (score >= 8) return Colors.success
  if (score >= 7) return Colors.success
  if (score >= 6) return Colors.warning
  if (score >= 5) return Colors.info
  return Colors.error
}

export const getBandLabel = (score: number): string => {
  if (score >= 8) return "Band 8-9"
  if (score >= 7) return "Band 7"
  if (score >= 6) return "Band 6"
  if (score >= 5) return "Band 5"
  return "Band 4"
}

export const formatDate = (value: string): string => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}
