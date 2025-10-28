import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

// This route uses searchParams, so it cannot be statically generated
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing id or type parameter" },
        { status: 400 }
      );
    }

    const url = `${API_BASE_URL}/api/meta/content?id=${id}&type=${type}`;

    console.log("[v0] Fetching content from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
    });

    console.log("[v0] Content response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] Content API error:", response.status, errorText);
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
    console.log("[v0] Content fetched successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Error fetching content:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch content",
      },
      { status: 500 }
    );
  }
}
