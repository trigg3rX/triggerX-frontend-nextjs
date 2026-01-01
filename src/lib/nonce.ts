import { headers } from "next/headers";

/**
 * Get the CSP nonce from request headers
 * This should be used in server components to get the nonce for inline scripts
 * @returns The nonce string, or empty string if not found
 */
export async function getNonce(): Promise<string> {
  try {
    const headersList = await headers();
    const nonce = headersList.get("x-nonce");

    if (!nonce || nonce.trim().length === 0) {
      return "";
    }

    return nonce;
  } catch {
    return "";
  }
}
