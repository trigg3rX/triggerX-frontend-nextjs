import { NextRequest, NextResponse } from "next/server";

/**
 * API route to proxy API key requests from external APIs
 * This bypasses CORS restrictions by making the request server-side
 */

// SSRF Protection: Block internal/localhost IPs
const BLOCKED_HOSTS = ["127.0.0.1", "localhost", "0.0.0.0", "::1"];

function isBlockedHost(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();
  return (
    BLOCKED_HOSTS.some((blocked) => lowerHostname === blocked) ||
    lowerHostname.includes("localhost") ||
    lowerHostname.includes("127.0.0.1") ||
    lowerHostname.startsWith("192.168.") ||
    lowerHostname.startsWith("10.")
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing 'url' query parameter" },
      { status: 400 },
    );
  }

  // Validate URL format and SSRF protection
  let url: URL;
  try {
    url = new URL(targetUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      return NextResponse.json(
        { error: "Invalid URL protocol. Only http and https are allowed." },
        { status: 400 },
      );
    }

    // SSRF Protection: Block internal/localhost hosts
    if (isBlockedHost(url.hostname)) {
      return NextResponse.json(
        { error: "Access to internal/localhost addresses is not allowed." },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // Make the request server-side (no CORS restrictions)
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return NextResponse.json(
        {
          error: `HTTP error! status: ${response.status}`,
          status: response.status,
          message: errorText,
        },
        { status: response.status },
      );
    }

    // Get the response data
    const contentType = response.headers.get("content-type");
    let data: unknown;

    if (contentType?.includes("application/json")) {
      const text = await response.text();
      data = JSON.parse(text);
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    // Return the data with CORS headers for the frontend
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      // Handle timeout
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return NextResponse.json({ error: "Request timeout" }, { status: 504 });
      }

      // Handle network errors
      if (
        error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED")
      ) {
        return NextResponse.json(
          { error: "Failed to connect to target server" },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
