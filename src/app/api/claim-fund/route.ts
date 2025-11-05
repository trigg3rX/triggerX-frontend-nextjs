import { devLog } from "@/lib/devLog";
import { getOrGenerateTraceId } from "@/lib/traceId";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9002";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const traceId = getOrGenerateTraceId(req.headers.get("X-Trace-ID"));
    devLog(`[API Route] [${traceId}] Proxying POST request to /api/claim-fund`);

    const response = await fetch(`${API_BASE_URL}/api/claim-fund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "X-Trace-ID": traceId,
      },
      body: JSON.stringify(body),
    });

    const data = await response.text();
    devLog("[API Route] Response status:", response.status);

    if (!response.ok) {
      return NextResponse.json(
        { error: data || "Failed to claim fund" },
        { status: response.status }
      );
    }

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    devLog("[API Route] Error in POST /api/claim-fund:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

