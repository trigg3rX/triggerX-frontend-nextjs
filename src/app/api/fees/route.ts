import { devLog } from "@/lib/devLog";
import { getOrGenerateTraceId } from "@/lib/traceId";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9002";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ipfsUrl = searchParams.get("ipfs_url");
    
    if (!ipfsUrl) {
      return NextResponse.json(
        { error: "Missing ipfs_url parameter" },
        { status: 400 }
      );
    }

    const traceId = getOrGenerateTraceId(req.headers.get("X-Trace-ID"));
    const url = `${API_BASE_URL}/api/fees?ipfs_url=${encodeURIComponent(ipfsUrl)}`;
    devLog(`[API Route] [${traceId}] Proxying GET request to:`, url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "X-Trace-ID": traceId,
      },
    });

    const data = await response.text();
    devLog("[API Route] Response status:", response.status);

    if (!response.ok) {
      return NextResponse.json(
        { error: data || "Failed to fetch fees" },
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
    devLog("[API Route] Error in GET /api/fees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

