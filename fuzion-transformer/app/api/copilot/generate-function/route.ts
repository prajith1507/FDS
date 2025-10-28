import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

const EXTERNAL_API_URL = `${API_BASE_URL}/api/function-gen/generate`;
const TENANT_ID = "507f1f77bcf86cd799439011";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transformedRequest = {
      sources: body.sources || { api: [], collection: [] },
      instructions: body.instructions || body.instruction || "",
    };

    console.log("[v0] Calling generate-function API:", EXTERNAL_API_URL);
    console.log(
      "[v0] Request body:",
      JSON.stringify(transformedRequest, null, 2)
    );

    const response = await fetch(EXTERNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify(transformedRequest),
      redirect: "follow",
    });

    console.log("[v0] Generate-function API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] Generate-function API error:", errorText);
      return NextResponse.json(
        { error: `API returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(
      "[v0] Generate-function API response:",
      JSON.stringify(data, null, 2)
    );

    if (data.status === 1 && data.data?.generated_function) {
      const transformedResponse = {
        success: true,
        message: data.message,
        transformCode: data.data.generated_function.code,
        functionName: data.data.generated_function.filename,
        description: data.data.generated_function.description,
        metadata: {
          summary: data.data.summary,
          apis_used: data.data.apis_used,
          collections_used: data.data.collections_used,
          llm_metadata: data.data.llm_metadata,
          next_steps: data.data.next_steps,
        },
      };
      return NextResponse.json(transformedResponse);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Error in generate-function route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
