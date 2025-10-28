import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/api-config"

const TENANT_ID = "507f1f77bcf86cd799439011"

export async function GET() {
  try {
    const url = `${API_BASE_URL}/api/generated-functions`

    console.log("[v0] Fetching generated functions from:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      redirect: "follow",
    })

    console.log("[v0] Fetch functions response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Fetch functions API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Fetch functions response received, count:", data?.length || 0)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching generated functions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch generated functions" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, shortDescription, longDescription, code, tags, status, createdBy } = body

    const url = `${API_BASE_URL}/api/generated-functions`

    console.log("[v0] Saving generated function to:", url)
    console.log("[v0] Request body:", { name, shortDescription, tags, status })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify({
        name,
        shortDescription,
        longDescription,
        code,
        tags,
        status,
        createdBy,
      }),
      redirect: "follow",
    })

    console.log("[v0] Save function response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Save function API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Save function response received:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error saving generated function:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save generated function" },
      { status: 500 },
    )
  }
}
