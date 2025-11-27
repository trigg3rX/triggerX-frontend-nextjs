import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_TABLEDATA_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY_TASKTABLE_ADMIN;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filterType = searchParams.get("filterType");
  const filterValue = searchParams.get("filterValue");

  // console.log("API_BASE_URL:", API_BASE_URL);
  // console.log("API_KEY:", API_KEY ? "✓ Loaded" : "✗ Missing");
  // console.log("Filter Type:", filterType, "Filter Value:", filterValue);

  if (!API_BASE_URL) {
    return NextResponse.json(
      {
        error:
          "API_BASE_URL is not configured. Please check your environment variables.",
      },
      { status: 500 },
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      {
        error:
          "API_KEY is not configured. Please check your environment variables.",
      },
      { status: 500 },
    );
  }

  if (!filterType || !filterValue) {
    return NextResponse.json(
      { error: "Missing filterType or filterValue" },
      { status: 400 },
    );
  }

  let apiUrl = "";

  switch (filterType) {
    case "user_address":
      apiUrl = `${API_BASE_URL}/api/tasks/user/${filterValue}`;
      break;
    case "job_id":
      apiUrl = `${API_BASE_URL}/api/tasks/job/${filterValue}`;
      break;
    case "task_id":
      apiUrl = `${API_BASE_URL}/api/tasks/${filterValue}`;
      break;
    case "api_key":
      apiUrl = `${API_BASE_URL}/api/tasks/by-apikey/${filterValue}`;
      break;
    case "safe_address":
      apiUrl = `${API_BASE_URL}/api/tasks/safe-address/${filterValue}`;
      break;
    default:
      return NextResponse.json(
        { error: "Invalid filter type" },
        { status: 400 },
      );
  }

  try {
    // console.log("Fetching from URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `Failed to fetch tasks: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    // console.log("Data received from backend:", JSON.stringify(data).substring(0, 500));
    // console.log("Data structure keys:", Object.keys(data));
    // console.log("Is array?:", Array.isArray(data));
    if (data.task_groups) {
      console.log("task_groups length:", data.task_groups?.length);
    }
    if (data.tasks) {
      console.log("tasks length:", data.tasks?.length);
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tasks from backend",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
