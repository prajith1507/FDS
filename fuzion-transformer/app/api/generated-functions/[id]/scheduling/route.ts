import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

const TENANT_ID = "507f1f77bcf86cd799439011";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const url = `${API_BASE_URL}/api/generated-functions/${id}/scheduling`;

    console.log("[v0] Updating function scheduling for:", id);
    console.log("[v0] Scheduling data:", body);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify(body),
      redirect: "follow",
    });

    console.log(
      "[v0] Update function scheduling response status:",
      response.status
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[v0] Update function scheduling API error:",
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
    console.log("[v0] Update function scheduling response received:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Error updating function scheduling:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update function scheduling",
      },
      { status: 500 }
    );
  }
}
