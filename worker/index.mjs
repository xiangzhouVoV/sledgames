function unavailable() {
  return Response.json({ error: { code: 'comments_unavailable', message: 'Comments are temporarily unavailable. Please try again later.' } }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname !== '/api' && !pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!env.COMMENTS_API) return unavailable();
    try {
      // Keep URL, Origin and client headers intact for the backend's security checks.
      return await env.COMMENTS_API.fetch(request);
    } catch {
      return unavailable();
    }
  },
};
