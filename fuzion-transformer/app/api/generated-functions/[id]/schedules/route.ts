import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

const TENANT_ID = "507f1f77bcf86cd799439011";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = `${API_BASE_URL}/api/generated-functions/${id}/schedules`;

    console.log("[v0] Fetching schedules for function:", id);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      redirect: "follow",
    });

    console.log(
      "[v0] Get function schedules response status:",
      response.status
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[v0] Get function schedules API error:",
        response.status,
        errorText
      );
      return NextResponse.json(
        {
          error: `API returned ${response.status}: ${
            errorText || response.statusText
          }`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[v0] Get function schedules response received:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Error fetching function schedules:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch function schedules",
      },
      { status: 500 }
    );
  }
}
