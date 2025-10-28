import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/api-config"

const TENANT_ID = "507f1f77bcf86cd799439011"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = `${API_BASE_URL}/api/schedule-functions${queryString ? `?${queryString}` : ""}`

    console.log("[v0] Fetching schedules from:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      redirect: "follow",
    })

    console.log("[v0] Fetch schedules response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Fetch schedules API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Fetch schedules response received, count:", data.data?.schedules?.length || 0)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching schedules:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch schedules" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = `${API_BASE_URL}/api/schedule-functions`

    console.log("[v0] Creating schedule:", body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify(body),
      redirect: "follow",
    })

    console.log("[v0] Create schedule response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Create schedule API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Create schedule response received:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating schedule:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create schedule" },
      { status: 500 },
    )
  }
}
