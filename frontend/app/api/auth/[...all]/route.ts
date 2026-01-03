/**
 * Auth API proxy route - forwards requests to backend auth endpoints
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname;
  const endpoint = pathname.replace('/api/auth/', '');
  const backendUrl = `${BACKEND_URL}/api/auth/${endpoint}`;
  
  try {
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Backend returned ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Backend service unavailable', details: String(error) }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
  const endpoint = pathname.replace('/api/auth/', '');
  const backendUrl = `${BACKEND_URL}/api/auth/${endpoint}`;
  
  try {
    const body = await request.json();
    
    console.log(`[Proxy] Forwarding POST to ${backendUrl}`);
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`[Proxy] Backend responded with status ${response.status}`);
    const data = await response.json().catch(e => {
      console.error(`[Proxy] Failed to parse JSON:`, e);
      return { error: 'Invalid JSON response from backend' };
    });
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Proxy] Error:`, errorMsg);
    return new Response(
      JSON.stringify({ error: 'Backend service unavailable', details: errorMsg }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}