import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sourceId, targetId, sourceOrder, targetOrder } = body

    if (!sourceId || !targetId || typeof sourceOrder !== 'number' || typeof targetOrder !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Make API call to your backend to update the collection order
    // Replace this URL with your actual backend API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/collections/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceId,
        targetId,
        sourceOrder,
        targetOrder
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error moving collection item:', error)
    return NextResponse.json(
      { error: 'Failed to move collection item' },
      { status: 500 }
    )
  }
}