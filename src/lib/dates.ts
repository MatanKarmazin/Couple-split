import { format, isValid, parseISO } from "date-fns";
import type { FirestoreDate } from "@/types";

export function toDate(value: FirestoreDate): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "string") return parseISO(value);
  if (typeof value === "number") return new Date(value);
  if ("toDate" in value) return value.toDate();
  if ("seconds" in value) return new Date(value.seconds * 1000);
  return new Date();
}

export function formatDate(value: FirestoreDate, pattern = "MMM d, yyyy") {
  const date = toDate(value);
  return isValid(date) ? format(date, pattern) : "Unknown date";
}

export function formatDateLocale(value: FirestoreDate, locale = "en-US", style: "medium" | "monthYear" = "medium") {
  const date = toDate(value);
  if (!isValid(date)) return locale.startsWith("he") ? "תאריך לא ידוע" : "Unknown date";

  if (style === "monthYear") {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
  }

  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function inputDate(value: FirestoreDate = new Date()) {
  return format(toDate(value), "yyyy-MM-dd");
}
