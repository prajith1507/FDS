import { type NextRequest, NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/api-config"

const TENANT_ID = "507f1f77bcf86cd799439011"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const url = `${API_BASE_URL}/api/generated-functions/${id}`

    console.log("[v0] Fetching generated function from:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      redirect: "follow",
    })

    console.log("[v0] Fetch function response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Fetch function API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Fetch function response received:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching generated function:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch generated function" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const url = `${API_BASE_URL}/api/generated-functions/${id}`

    console.log("[v0] Deleting generated function:", url)

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      redirect: "follow",
    })

    console.log("[v0] Delete function response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Delete function API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Delete function response received:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error deleting generated function:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete generated function" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const url = `${API_BASE_URL}/api/generated-functions/${id}`

    console.log("[v0] Updating generated function:", url)
    console.log("[v0] Update payload:", body)

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
      },
      body: JSON.stringify(body),
      redirect: "follow",
    })

    console.log("[v0] Update function response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Update function API error:", response.status, errorText)
      return NextResponse.json(
        { error: `API returned ${response.status}: ${errorText || response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Update function response received:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating generated function:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update generated function" },
      { status: 500 },
    )
  }
}
