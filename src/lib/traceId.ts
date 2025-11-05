/**
 * Generates a unique trace ID for frontend requests
 * Format: tgrx-frnt-<uuid>
 */
export function generateTraceId(): string {
  // Generate a UUID v4
  const uuid = crypto.randomUUID();
  return `tgrx-frnt-${uuid}`;
}

/**
 * Gets or generates a trace ID for a request
 * If a trace ID is provided in the request headers, it will be used
 * Otherwise, a new one will be generated
 */
export function getOrGenerateTraceId(existingTraceId?: string | null): string {
  if (existingTraceId) {
    return existingTraceId;
  }
  return generateTraceId();
}

