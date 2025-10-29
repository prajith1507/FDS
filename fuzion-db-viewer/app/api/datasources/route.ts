import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://obl-syncapi.fuzionest.com'

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    console.log('[DB-VIEWER] Fetching datasources from:', `${API_BASE_URL}/api/datasources`)
    
    const response = await fetch(`${API_BASE_URL}/api/datasources`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('[DB-VIEWER] Failed to fetch datasources:', response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch datasources', data: { datasources: [] } },
        { 
          status: 200, // Return 200 with empty data instead of error status
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    const data = await response.json()
    console.log('[DB-VIEWER] Datasources fetched successfully, count:', data.data?.datasources?.length || 0)
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  } catch (error) {
    console.error('[DB-VIEWER] Error fetching datasources:', error)
    return NextResponse.json(
      { error: 'Internal server error', data: { datasources: [] } },
      { 
        status: 200, // Return 200 with empty data for graceful fallback
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }
}