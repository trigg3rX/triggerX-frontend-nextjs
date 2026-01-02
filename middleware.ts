import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Generate a cryptographically secure random nonce for this request
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const nonce = Buffer.from(array).toString("base64");

  // Validate nonce was generated successfully
  const nonceGenerated = nonce && nonce.length > 0;

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Only set nonce in headers if generation was successful
  if (nonceGenerated) {
    requestHeaders.set("x-nonce", nonce);
  } else {
    // If nonce generation fails, don't set it in headers to prevent invalid CSP
  }

  // Set CSP header with nonce and strict-dynamic
  // Based on mainnet-frontend usage:
  // - Google Tag Manager (GTM-N23BN7R5)
  // - Sanity CMS (cdn.sanity.io)
  // - img.logo.dev
  // - Web3 services (wagmi, rainbowkit, ethers, viem)
  // - WebSocket connections
  // - External APIs
  // Using nonce + strict-dynamic: allows scripts with nonce AND scripts loaded by those scripts
  // Note: 'unsafe-eval' is only included in development mode for Next.js HMR
  const isDevelopment = process.env.NODE_ENV === "development";
  const unsafeEval = isDevelopment ? " 'unsafe-eval'" : "";

  // Build CSP header - include nonce only if it was generated successfully
  const nonceDirective = nonceGenerated ? ` 'nonce-${nonce}'` : "";
  const localApi = process.env.NEXT_PUBLIC_API_BASE_URL;

  const connectSrc =
    isDevelopment && localApi
      ? `connect-src 'self' https: wss: ${localApi};`
      : "connect-src 'self' https: wss;";

  console.log("connect src", connectSrc);
  const cspHeader = `
    default-src 'self';
    script-src 'self'${nonceDirective}${nonceGenerated ? " 'strict-dynamic'" : ""}${unsafeEval} https://www.googletagmanager.com https://www.google-analytics.com https://cdn.sanity.io;
    ${connectSrc}
    style-src 'self' 'unsafe-inline' https:;
    img-src 'self' data: https: blob:;
    font-src 'self' data: https:;
    frame-src 'self' https://www.googletagmanager.com https://www.google.com https://www.gstatic.com;
    object-src 'none';
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // Create response with updated headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Determine CSP mode based on nonce generation
  const enforceCSP = nonceGenerated;

  if (enforceCSP) {
    response.headers.set("Content-Security-Policy", cspHeader);
  } else {
    response.headers.set("Content-Security-Policy-Report-Only", cspHeader);
  }

  // Set additional security headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "interest-cohort=(), geolocation=(), camera=(), microphone=(), usb=(), serial=(), hid=(), payment=(), display-capture=(), encrypted-media=(), xr-spatial-tracking=()",
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
