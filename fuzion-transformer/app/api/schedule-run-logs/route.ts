import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/api-config"

// This route uses searchParams, so it cannot be statically generated
export const dynamic = 'force-dynamic'

const TENANT_ID = "tenant_orient_bell"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()

    const url = `${API_BASE_URL}/api/schedule-run-logs${queryString ? `?${queryString}` : ""}`

    console.log("[v0] Proxying schedule run logs request to:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
    })

    console.log("[v0] Backend response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Backend error:", errorText)
      return NextResponse.json(
        { error: "Failed to fetch schedule run logs", details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in schedule-run-logs route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
