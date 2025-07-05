import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl(): string {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Fallback for development
  if (process.env.NODE_ENV === "development") {
    return "https://triggerx-app-nextjs.vercel.app";
  }

  // Fallback for production (you can customize this)
  return "https://app.triggerx.network/";
}

/**
 * Get the full URL for a specific path
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
