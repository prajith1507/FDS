import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET() {
  // Read configured collections URL from env, fall back to base/api/apis
  const rawUrl = process.env.NEXT_PUBLIC_COLLECTIONS_URL || (process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/collections/` : null)
  const apiApisUrl = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/apis/` : null

  if (!rawUrl && !apiApisUrl) {
    return NextResponse.json({ error: 'No collections or apis URL configured' }, { status: 400, headers: corsHeaders })
  }

  const candidates = [rawUrl, apiApisUrl].filter(Boolean) as string[]

  // helper to attempt fetch and parse JSON/text
  const tryFetch = async (u: string) => {
    const res = await fetch(u, { method: 'GET' })
    const contentType = res.headers.get('content-type') || ''
    const text = await res.text()
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text)
      } catch {
        return { body: text }
      }
    }
    return { body: text }
  }

  let upstream: any = null
  // Try direct, then encoded for each candidate
  for (const candidate of candidates) {
    try {
      upstream = await tryFetch(candidate)
      console.log('Proxy fetched from', candidate)
      break
    } catch (err) {
      try {
        const enc = encodeURI(candidate)
        upstream = await tryFetch(enc)
        console.log('Proxy fetched from encoded', enc)
        break
      } catch (err2) {
        console.warn('Candidate failed:', candidate, err2)
        // continue
      }
    }
  }

  if (!upstream) {
    return NextResponse.json({ error: 'All fetch attempts failed' }, { status: 502, headers: corsHeaders })
  }

  // Normalize upstream to an array of items when possible
  let collectionsArray: any[] = []
  if (Array.isArray(upstream)) {
    collectionsArray = upstream
  } else if (upstream && Array.isArray(upstream.items)) {
    collectionsArray = upstream.items
  } else if (upstream && Array.isArray(upstream.apis)) {
    collectionsArray = upstream.apis
  } else if (upstream && Array.isArray(upstream.body)) {
    collectionsArray = upstream.body
  } else if (upstream && typeof upstream === 'object') {
    // Try to extract nested arrays or object-values
    const vals = Object.values(upstream)
    for (const v of vals) {
      if (Array.isArray(v)) {
        collectionsArray = v
        break
      }
    }
  }

  // If we couldn't get an array, return upstream as-is
  if (!collectionsArray || collectionsArray.length === 0) {
    return NextResponse.json(upstream, { headers: corsHeaders })
  }

  // Try to fetch the richer /api/apis/ list if it's different from the upstream source
  let detailsArray: any[] = []
  try {
    if (apiApisUrl) {
      const details = await tryFetch(apiApisUrl)
      if (Array.isArray(details)) detailsArray = details
      else if (details && Array.isArray(details.items)) detailsArray = details.items
      else if (details && Array.isArray(details.apis)) detailsArray = details.apis
      else if (details && Array.isArray(details.body)) detailsArray = details.body
    }
  } catch (err) {
    console.warn('Failed to fetch details from apiApisUrl', apiApisUrl, err)
  }

  // Build map from details by common keys: key, id, name
  const detailMap = new Map<string, any>()
  for (const d of detailsArray) {
    const k = String(d.key || d.id || d.name || d.path || '').toLowerCase()
    if (k) detailMap.set(k, d)
  }

  // Merge: prefer detailed headers/values if missing in collectionsArray
  const merged = collectionsArray.map((c: any) => {
    const matchKeyCandidates = [c.key, c.id, c.name, c.path].map((x: any) => (x ? String(x).toLowerCase() : ''))
    let found: any = null
    for (const k of matchKeyCandidates) {
      if (k && detailMap.has(k)) {
        found = detailMap.get(k)
        break
      }
    }
    const mergedItem = { ...c }
    if (found) {
      // copy missing fields from found
      for (const fld of ['headers', 'body', 'sampleResponse', 'response_schema', 'auth_config']) {
        if ((mergedItem as any)[fld] == null && (found as any)[fld] != null) {
          (mergedItem as any)[fld] = (found as any)[fld]
        }
      }
      // if headers empty but found has headers, use found
      if ((!mergedItem.headers || mergedItem.headers.length === 0) && found.headers) {
        mergedItem.headers = found.headers
      }
    }
    return mergedItem
  })

  return NextResponse.json(merged, { headers: corsHeaders })
}

export function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}
