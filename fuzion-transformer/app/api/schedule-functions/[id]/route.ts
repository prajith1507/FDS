import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/api-config"

const TENANT_ID = "507f1f77bcf86cd799439011"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const url = `${API_BASE_URL}/api/schedule-functions/${id}`

    console.log("[v0] Fetching schedule status:", id)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      redirect: "follow",
    })

    console.log("[v0] Get schedule status response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Get schedule status API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Get schedule status response received:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching schedule status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch schedule status" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const url = `${API_BASE_URL}/api/schedule-functions/${id}`

    console.log("[v0] Updating schedule:", id)
    console.log("[v0] Update data:", body)

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify(body),
      redirect: "follow",
    })

    console.log("[v0] Update schedule response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Update schedule API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Update schedule response received:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating schedule:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update schedule" },
      { status: 500 },
    )
  }
}
