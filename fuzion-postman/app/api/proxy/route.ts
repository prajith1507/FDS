import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key, X-Binance-APIKey',
};

export async function GET(req: NextRequest) {
  return handleRequest(req, 'GET');
}

export async function POST(req: NextRequest) {
  return handleRequest(req, 'POST');
}

export async function PUT(req: NextRequest) {
  return handleRequest(req, 'PUT');
}

export async function DELETE(req: NextRequest) {
  return handleRequest(req, 'DELETE');
}

export async function PATCH(req: NextRequest) {
  return handleRequest(req, 'PATCH');
}

async function handleRequest(req: NextRequest, method: string) {
  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'No target URL provided' }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse body for non-GET requests
    let body = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        body = await req.text();
      } catch (e) {
        // Empty body is fine
        body = undefined;
      }
    }

    // Forward relevant headers, excluding problematic ones
    const forwardedHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      
      // Skip problematic headers that expose this as a proxy
      if ([
        'host',
        'origin', 
        'referer',
        'x-forwarded-for',
        'x-forwarded-host',
        'x-forwarded-proto',
        'x-real-ip',
        'cf-connecting-ip',
        'cf-ipcountry',
        'cf-ray',
        'cf-visitor'
      ].includes(lowerKey)) {
        return;
      }
      
      // Include auth and API-related headers
      if ([
        'authorization',
        'x-api-key',
        'x-binance-apikey',
        'content-type',
        'accept',
        'user-agent'
      ].includes(lowerKey) || lowerKey.startsWith('x-')) {
        forwardedHeaders[key] = value;
      }
    });

    // Add a more realistic User-Agent if none provided
    if (!forwardedHeaders['User-Agent'] && !forwardedHeaders['user-agent']) {
      forwardedHeaders['User-Agent'] = 'PostmanClone/1.0';
    }

    console.log(`🌐 Proxying ${method} request to:`, targetUrl);
    console.log('📋 Headers being forwarded:', Object.keys(forwardedHeaders));

    const response = await fetch(targetUrl, {
      method,
      headers: forwardedHeaders,
      body,
      cache: 'no-store'
    });

    const responseHeaders = Object.fromEntries(response.headers.entries());
    let responseData;

    try {
      const responseText = await response.text();
      // Try to parse as JSON first
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // If not JSON, return as text
        responseData = responseText;
      }
    } catch (e) {
      responseData = { error: 'Failed to read response body' };
    }

    // Enhanced error handling for common API issues
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let suggestions = [];

      // Specific handling for 403 Forbidden
      if (response.status === 403) {
        errorMessage = `Access Forbidden (${response.status})`;
        
        // Check if this looks like a protected API
        const hostname = new URL(targetUrl).hostname;
        if (hostname.includes('binance') || hostname.includes('exchange')) {
          suggestions.push('💡 This API requires authentication. Try using:');
          suggestions.push('   • API Key authentication in the Authorization tab');
          suggestions.push('   • Bearer Token if you have an access token');
          suggestions.push('   • Check the API documentation for required headers');
        } else {
          suggestions.push('💡 This API might require:');
          suggestions.push('   • API authentication (check Authorization tab)');
          suggestions.push('   • Specific headers or user agent');
          suggestions.push('   • IP whitelisting or rate limiting');
        }
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        errorMessage = `Unauthorized (${response.status})`;
        suggestions.push('💡 Authentication required:');
        suggestions.push('   • Check your API key or token');
        suggestions.push('   • Verify credentials in Authorization tab');
        suggestions.push('   • Ensure correct authentication method');
      }

      // Handle 429 Rate Limited
      if (response.status === 429) {
        errorMessage = `Rate Limited (${response.status})`;
        suggestions.push('💡 Too many requests:');
        suggestions.push('   • Wait before making another request');
        suggestions.push('   • Check API rate limits in documentation');
        suggestions.push('   • Consider using API keys for higher limits');
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          status: response.status,
          statusText: response.statusText,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
          body: responseData,
          headers: responseHeaders
        },
        { 
          status: response.status,
          headers: corsHeaders
        }
      );
    }

    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'X-Response-Status': response.status.toString(),
        'X-Response-Status-Text': response.statusText
      }
    });

  } catch (error: any) {
    console.error('Proxy error:', error);
    
    let errorMessage = 'Failed to fetch data';
    let suggestions = [];

    // Handle network errors
    if (error.message.includes('fetch')) {
      errorMessage = 'Network error - could not reach the API';
      suggestions.push('💡 Check:');
      suggestions.push('   • URL is correct and accessible');
      suggestions.push('   • API server is running');
      suggestions.push('   • No network connectivity issues');
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        message: error.message,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: corsHeaders
  });
}