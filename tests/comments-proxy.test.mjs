import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

test('API forwarding preserves origin, credentials, body and backend errors without retrying', async () => {
  const request = new Request('https://sledgames.com/api/comments', {
    method: 'POST',
    headers: { Origin: 'https://sledgames.com', Authorization: 'Bearer private-admin-token', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
    body: JSON.stringify({ gameSlug: 'sled-rider', content: 'A winter run.' }),
  });
  let calls = 0;
  const response = await worker.fetch(request, {
    COMMENTS_API: { async fetch(forwarded) {
      calls++;
      assert.equal(forwarded.url, request.url);
      assert.equal(forwarded.headers.get('Origin'), 'https://sledgames.com');
      assert.equal(forwarded.headers.get('Authorization'), 'Bearer private-admin-token');
      assert.equal(forwarded.headers.get('CF-Connecting-IP'), '192.0.2.1');
      assert.equal((await forwarded.json()).gameSlug, 'sled-rider');
      return Response.json({ error: { code: 'rate_limited' } }, { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
    } },
    ASSETS: { fetch() { assert.fail('API requests must never reach static assets'); } },
  });
  assert.equal(calls, 1);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('missing or disconnected backend gives an uncached JSON 503', async () => {
  for (const env of [{}, { COMMENTS_API: { fetch() { throw new Error('Unavailable'); } } }]) {
    const response = await worker.fetch(new Request('https://sledgames.com/api/admin/comments'), env);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal((await response.json()).error.code, 'comments_unavailable');
  }
});

test('static pages retain their asset response including redirects and 404s', async () => {
  for (const [path, status] of [['/snow-rider-2', 307], ['/snow-rider-2/', 200], ['/missing/', 404], ['/api-example/', 404]]) {
    const response = await worker.fetch(new Request(`https://sledgames.com${path}`), {
      ASSETS: { fetch() { return new Response('static', { status }); } },
      COMMENTS_API: { fetch() { assert.fail('A page request must not reach the backend'); } },
    });
    assert.equal(response.status, status);
    assert.equal(await response.text(), 'static');
  }
});

test('admin sessions preserve browser cookies, CSRF headers and logout cookie clearing', async () => {
  const request = new Request('https://sledgames.com/api/admin/logout/', {
    method: 'POST',
    headers: {
      Origin: 'https://sledgames.com',
      Cookie: '__Host-sledgames_admin=opaque-test-session',
      'X-CSRF-Token': 'test-csrf-token',
    },
  });
  const clearCookie = '__Host-sledgames_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
  const response = await worker.fetch(request, {
    COMMENTS_API: { async fetch(forwarded) {
      assert.equal(forwarded.headers.get('Cookie'), request.headers.get('Cookie'));
      assert.equal(forwarded.headers.get('X-CSRF-Token'), 'test-csrf-token');
      assert.equal(forwarded.headers.get('Origin'), 'https://sledgames.com');
      return new Response(null, { status: 204, headers: { 'Set-Cookie': clearCookie, 'Cache-Control': 'no-store' } });
    } },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Set-Cookie'), clearCookie);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
