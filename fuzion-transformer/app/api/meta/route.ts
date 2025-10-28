import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeCounts = searchParams.get("includeCounts");

    const url = `${API_BASE_URL}/api/meta${
      includeCounts ? `?includeCounts=${includeCounts}` : ""
    }`;

    console.log("[v0] Fetching metadata from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
    });

    console.log("[v0] Metadata response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] Metadata API error:", response.status, errorText);
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
    console.log("[v0] Metadata fetched successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Error fetching metadata:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch metadata",
      },
      { status: 500 }
    );
  }
}
