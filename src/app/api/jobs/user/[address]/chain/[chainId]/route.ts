import { devLog } from "@/lib/devLog";
import { getOrGenerateTraceId } from "@/lib/traceId";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:9002";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string; chainId: string } }
) {
  try {
    const { address, chainId } = params;
    const traceId = getOrGenerateTraceId(req.headers.get("X-Trace-ID"));
    devLog(
      `[API Route] [${traceId}] Proxying GET request to /api/jobs/user/${address}/chain/${chainId}`
    );

    const response = await fetch(
      `${API_BASE_URL}/api/jobs/user/${address}/chain/${chainId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": API_KEY,
          "X-Trace-ID": traceId,
        },
      }
    );

    const data = await response.text();
    devLog("[API Route] Response status:", response.status);

    if (!response.ok) {
      return NextResponse.json(
        { error: data || "Failed to fetch jobs" },
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
    devLog("[API Route] Error in GET /api/jobs/user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

