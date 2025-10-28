import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

export async function GET() {
  try {
    const url = `${API_BASE_URL}/api/meta/keys`;

    console.log("[v0] Fetching keys from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
    });

    console.log("[v0] Keys response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] Keys API error:", response.status, errorText);
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
    console.log("[v0] Keys fetched successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Error fetching keys:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch keys",
      },
      { status: 500 }
    );
  }
}
