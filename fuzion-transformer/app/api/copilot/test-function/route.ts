import { type NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api-config";

const TENANT_ID = "507f1f77bcf86cd799439011";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(
      "[v0] Calling test-code API:",
      `${API_BASE_URL}/api/function-gen/test-code`
    );
    console.log("[v0] Request body:", JSON.stringify(body, null, 2));

    const requestBody = {
      code: body.functionCode,
      testData: body.testData || {},
    };

    const response = await fetch(`${API_BASE_URL}/api/function-gen/test-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify(requestBody),
      redirect: "follow",
    });

    console.log("[v0] Test-code API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(async () => {
        const errorText = await response.text();
        return { error: errorText };
      });
      console.error("[v0] Test-code API error:", errorData);

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || "Function execution failed",
          error: errorData.error || errorData.message,
          executionTime: 0,
          logs: [],
          metadata: {},
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("[v0] Test-code API response:", JSON.stringify(data, null, 2));

    const transformedResponse = {
      success: data.status === 1,
      message: data.message,
      result: data.data?.output,
      executionTime: data.data?.execution_time_ms || 0,
      logs: [
        // Transform console_logs to frontend log format
        ...(data.data?.console_logs || []).map((log: any) => ({
          type:
            log.type === "warn"
              ? "warning"
              : log.type === "error"
              ? "error"
              : "info",
          message: log.message,
          timestamp: new Date().toISOString(),
        })),
        // Add errors as log entries
        ...(data.data?.errors || []).map((error: any) => ({
          type: "error",
          message:
            typeof error === "string"
              ? error
              : error.message || JSON.stringify(error),
          timestamp: new Date().toISOString(),
        })),
        // Add warnings as log entries
        ...(data.data?.warnings || []).map((warning: any) => ({
          type: "warning",
          message:
            typeof warning === "string"
              ? warning
              : warning.message || JSON.stringify(warning),
          timestamp: new Date().toISOString(),
        })),
      ],
      metadata: {
        testDataProvided: data.data?.test_data_provided || false,
        testDataKeys: data.data?.test_data_keys || [],
        codeInfo: data.data?.code_info || {},
      },
    };

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error("[v0] Test-code API route error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to test function",
        error: error instanceof Error ? error.message : String(error),
        executionTime: 0,
        logs: [],
        metadata: {},
      },
      { status: 500 }
    );
  }
}
