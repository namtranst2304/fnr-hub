import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateStr: string | null | undefined, locale = 'vi-VN') => {
  if (!dateStr) return 'UNKNOWN';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 'INVALID_DATE' : d.toLocaleString(locale);
};
