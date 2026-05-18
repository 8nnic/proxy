// Cloudflare Worker — deploy at https://dash.cloudflare.com
// Workers → Create Worker → paste this → Save & Deploy

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // ?url= parameter holds the target
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Forward the request
    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': request.headers.get('Accept') || '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
      redirect: 'follow',
    });

    let response;
    try {
      response = await fetch(proxyRequest);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Fetch failed: ' + e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const contentType = response.headers.get('Content-Type') || '';

    // For HTML: rewrite links so relative URLs resolve correctly
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const base = targetUrl.origin;

      // Inject <base> tag so relative paths work
      html = html.replace(/(<head[^>]*>)/i, `$1<base href="${targetUrl.href}">`);

      // Rewrite absolute links to go through the proxy
      // (optional — helps with navigation staying within the proxy)
      html = html.replace(/(href|src|action)="(https?:\/\/[^"]+)"/gi, (_, attr, link) => {
        return `${attr}="/?url=${encodeURIComponent(link)}"`;
      });

      return new Response(html, {
        status: response.status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'X-Proxied-From': targetUrl.origin,
        },
      });
    }

    // For everything else: pass through as-is
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.delete('Content-Security-Policy');
    headers.delete('X-Frame-Options');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  },
};
