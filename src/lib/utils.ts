import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to remove undefined values from an object before sending to Firestore
export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
