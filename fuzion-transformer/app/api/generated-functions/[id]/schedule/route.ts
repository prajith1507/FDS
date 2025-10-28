import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/api-config"

const TENANT_ID = "507f1f77bcf86cd799439011"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const url = `${API_BASE_URL}/api/generated-functions/${id}/schedule`

    console.log("[v0] Creating quick schedule for function:", id)
    console.log("[v0] Schedule data:", body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify(body),
      redirect: "follow",
    })

    console.log("[v0] Create quick schedule response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Create quick schedule API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Create quick schedule response received:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating quick schedule:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create quick schedule" },
      { status: 500 },
    )
  }
}
