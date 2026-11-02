import { test, expect, type Page, type Route } from '@playwright/test';

const comment = (id: number, content = `Snowy run ${id}`) => ({
  id, gameSlug: 'sled-rider', nickname: `Player ${id}`, content,
  createdAt: '2026-11-01T04:00:00.000Z', reply: null as string | null, replyUpdatedAt: null as string | null,
});

async function blockExternalResources(page: Page) {
  await page.route(/^https:\/\//, route => {
    if (route.request().resourceType() === 'image') return route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300"><rect width="480" height="300" fill="#cee7ff"/></svg>',
    });
    if (route.request().resourceType() === 'document') return route.fulfill({ contentType: 'text/html', body: '<p>Official player fixture</p>' });
    return route.abort();
  });
}

async function mockComments(page: Page, handler: (route: Route) => Promise<unknown>) {
  await page.route(url => /^\/api\/comments\/?$/.test(url.pathname), handler);
}

async function openComments(page: Page, slug = 'sled-rider') {
  await page.goto(`/${slug}/`);
  const section = page.locator('#comments[data-game-comments]');
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('heading', { name: 'Player comments', exact: true })).toBeVisible();
  return section;
}

test.beforeEach(async ({ page }) => { await blockExternalResources(page); });

test('public comments paginate by game and display visitor text and owner replies safely', async ({ page }) => {
  const requests: URL[] = [];
  const unsafe = '<img src=x onerror="window.commentXss=true">';
  await mockComments(page, async route => {
    const url = new URL(route.request().url());
    requests.push(url);
    const first = { ...comment(30, unsafe), nickname: '<script>window.commentXss=true</script>', reply: 'Thanks for the tip!', replyUpdatedAt: '2026-11-01T05:00:00.000Z' };
    await route.fulfill({ json: url.searchParams.has('cursor')
      ? { comments: [comment(29)], nextCursor: null }
      : { comments: [first], nextCursor: 30 } });
  });
  const section = await openComments(page);
  const items = section.locator('[data-comments-list] > [data-comment-id]');
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText(unsafe);
  await expect(items.first()).toContainText('<script>window.commentXss=true</script>');
  await expect(items.first()).toContainText('Sled Games reply');
  await expect(items.first()).toContainText('Thanks for the tip!');
  await expect(items.locator('img, script')).toHaveCount(0);
  expect(await page.evaluate(() => 'commentXss' in window)).toBe(false);
  await section.getByRole('button', { name: 'Load more comments' }).click();
  await expect(items).toHaveCount(2);
  await expect(section.getByRole('button', { name: 'Load more comments' })).toBeHidden();
  expect(requests).toHaveLength(2);
  expect(requests.map(url => url.searchParams.get('gameSlug'))).toEqual(['sled-rider', 'sled-rider']);
  expect(requests.map(url => url.searchParams.get('cursor'))).toEqual([null, '30']);
  expect(requests[0].searchParams.get('limit')).toBe('10');
});

test('a failed list request offers a retry and preserves already loaded comments', async ({ page }) => {
  let attempts = 0;
  await mockComments(page, async route => {
    attempts++;
    if (attempts === 1 || attempts === 3) return route.fulfill({ status: 503, json: { error: { code: 'service_unavailable', message: 'Comments are temporarily unavailable.' } } });
    return route.fulfill({ json: attempts === 2
      ? { comments: [comment(8)], nextCursor: 8 }
      : { comments: [comment(7)], nextCursor: null } });
  });
  const section = await openComments(page);
  await expect(section.locator('[data-comments-status]')).toContainText(/unavailable|could not|couldn.t|try again/i);
  await section.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(section.locator('[data-comment-id]')).toHaveCount(1);
  await section.getByRole('button', { name: 'Load more comments' }).click();
  await expect(section.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await expect(section.locator('[data-comment-id]')).toHaveCount(1);
  await section.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(section.locator('[data-comment-id]')).toHaveCount(2);
  expect(attempts).toBe(4);
});

test('submitting sends the current game once and keeps pending comments out of the public list', async ({ page }) => {
  const posted: Record<string, unknown>[] = [];
  let completePost: (() => void) | undefined;
  const postReady = new Promise<void>(resolve => { completePost = resolve; });
  await mockComments(page, async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { comments: [], nextCursor: null } });
    posted.push(route.request().postDataJSON());
    await postReady;
    return route.fulfill({ status: 201, json: { id: 42, status: 'pending' } });
  });
  const section = await openComments(page, 'snow-rider-2');
  await expect(section.locator('[data-comments-status]')).toContainText(/no comments|first/i);
  await section.getByLabel('Nickname', { exact: true }).fill('  SnowFan  ');
  await section.getByLabel('Your comment', { exact: true }).fill('  I enjoyed the second jump.  ');
  const submit = section.getByRole('button', { name: 'Submit comment', exact: true });
  await submit.click();
  await expect.poll(() => posted.length).toBe(1);
  await expect(section.locator('button[type="submit"]')).toBeDisabled();
  expect(posted[0]).toMatchObject({ gameSlug: 'snow-rider-2', nickname: 'SnowFan', content: 'I enjoyed the second jump.', website: '' });
  expect(posted[0]).not.toHaveProperty('status');
  expect(posted[0]).not.toHaveProperty('reply');
  completePost!();
  await expect(section.locator('[data-comment-status]')).toHaveText('Thanks! Your comment is awaiting review.');
  await expect(section.locator('[data-comment-id]')).toHaveCount(0);
  await expect(section.getByLabel('Your comment', { exact: true })).toHaveValue('');
  await expect(submit).toBeEnabled();
  expect(posted).toHaveLength(1);
});

test('form validation blocks blank and overlong comments while allowing Unicode nicknames', async ({ page }) => {
  const posted: Record<string, unknown>[] = [];
  await mockComments(page, async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { comments: [], nextCursor: null } });
    posted.push(route.request().postDataJSON());
    return route.fulfill({ status: 201, json: { id: 2, status: 'pending' } });
  });
  const section = await openComments(page);
  const nickname = section.getByLabel('Nickname', { exact: true });
  const content = section.getByLabel('Your comment', { exact: true });
  const submit = section.getByRole('button', { name: 'Submit comment', exact: true });
  await nickname.fill('SnowFan');
  await content.fill('   ');
  await submit.click();
  expect(await content.evaluate((node: HTMLTextAreaElement) => node.validity.valid)).toBe(false);
  expect(posted).toHaveLength(0);
  await content.fill('x'.repeat(2001));
  await submit.click();
  expect(await content.evaluate((node: HTMLTextAreaElement) => node.validity.valid)).toBe(false);
  expect(posted).toHaveLength(0);
  await nickname.fill('🎿'.repeat(40));
  await content.fill('A good run.');
  await submit.click();
  await expect(section.locator('[data-comment-status]')).toHaveText('Thanks! Your comment is awaiting review.');
  expect(posted).toHaveLength(1);
  expect(posted[0].nickname).toBe('🎿'.repeat(40));
});

test('failed submissions and rate limits keep the draft for correction', async ({ page }) => {
  let attempts = 0;
  await mockComments(page, async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { comments: [], nextCursor: null } });
    attempts++;
    return route.fulfill(attempts === 1
      ? { status: 400, json: { error: { code: 'invalid_input', message: 'Please choose a different nickname.' } } }
      : { status: 429, headers: { 'Retry-After': '60' }, json: { error: { code: 'rate_limited', message: 'Too many attempts. Please try again later.' } } });
  });
  const section = await openComments(page);
  await section.getByLabel('Nickname', { exact: true }).fill('SnowFan');
  await section.getByLabel('Your comment', { exact: true }).fill('Please keep my draft.');
  await section.getByRole('button', { name: 'Submit comment', exact: true }).click();
  await expect(section.locator('[data-comment-status]')).toContainText('Please choose a different nickname.');
  await expect(section.getByLabel('Your comment', { exact: true })).toHaveValue('Please keep my draft.');
  await section.getByLabel('Nickname', { exact: true }).fill('WinterFan');
  await section.getByRole('button', { name: 'Submit comment', exact: true }).click();
  await expect(section.locator('[data-comment-status]')).toContainText(/too many|try again|wait/i);
  await expect(section.getByLabel('Your comment', { exact: true })).toHaveValue('Please keep my draft.');
  await expect(section.getByLabel('Nickname', { exact: true })).toHaveValue('WinterFan');
  expect(attempts).toBe(2);
});

test('a lost submission response preserves text and does not automatically post again', async ({ page }) => {
  let attempts = 0;
  await mockComments(page, async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { comments: [], nextCursor: null } });
    attempts++;
    return route.abort('failed');
  });
  const section = await openComments(page);
  await section.getByLabel('Nickname', { exact: true }).fill('SnowFan');
  await section.getByLabel('Your comment', { exact: true }).fill('A draft with an uncertain result.');
  await section.getByRole('button', { name: 'Submit comment', exact: true }).click();
  await expect(section.locator('[data-comment-status]')).toContainText(/may|received|confirm/i);
  await expect(section.getByLabel('Your comment', { exact: true })).toHaveValue('A draft with an uncertain result.');
  expect(attempts).toBe(1);
});

test('security checks recover from load errors, expire safely and reset after a submission', async ({ page }) => {
  let challengeLoads = 0;
  const posted: Record<string, unknown>[] = [];
  await page.route(url => url.origin === 'http://127.0.0.1:4321' && url.pathname === '/sled-rider/', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/data-turnstile-site-key(?:="[^"]*")?/, 'data-turnstile-site-key="test-public-key"');
    return route.fulfill({ response, body });
  });
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', route => {
    challengeLoads++;
    if (challengeLoads === 1) return route.abort();
    return route.fulfill({ contentType: 'application/javascript', body: `
      window.__commentChallenge = { renders: 0, resets: 0, removals: 0 };
      window.turnstile = {
        ready(callback) { callback(); },
        render(element, options) {
          window.__commentChallenge.options = options;
          window.__commentChallenge.renders++;
          element.textContent = 'Security check fixture';
          return 'test-widget';
        },
        reset() { window.__commentChallenge.resets++; },
        remove() { window.__commentChallenge.removals++; }
      };
    ` });
  });
  await mockComments(page, async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { comments: [], nextCursor: null } });
    posted.push(route.request().postDataJSON());
    return route.fulfill({ status: 201, json: { id: 4, status: 'pending' } });
  });
  const section = await openComments(page);
  const submit = section.getByRole('button', { name: 'Submit comment', exact: true });
  const retryChallenge = section.getByRole('button', { name: 'Retry security check' });
  await expect(submit).toBeDisabled();
  await expect(retryChallenge).toBeVisible();
  await retryChallenge.click();
  await expect.poll(() => page.evaluate('window.__commentChallenge?.renders')).toBe(1);
  expect(await page.evaluate('window.__commentChallenge.options.action')).toBe('comment');
  await page.evaluate("window.__commentChallenge.options.callback('verified-token')");
  await expect(submit).toBeEnabled();
  await page.evaluate("window.__commentChallenge.options['expired-callback']()");
  await expect(submit).toBeDisabled();
  await expect(section.locator('[data-challenge-status]')).toContainText('expired');
  await retryChallenge.click();
  await expect.poll(() => page.evaluate('window.__commentChallenge.renders')).toBe(2);
  await page.evaluate("window.__commentChallenge.options['error-callback']()");
  await expect(submit).toBeDisabled();
  await expect(retryChallenge).toBeVisible();
  await retryChallenge.click();
  await page.evaluate("window.__commentChallenge.options.callback('fresh-token')");
  await section.getByLabel('Nickname', { exact: true }).fill('SnowFan');
  await section.getByLabel('Your comment', { exact: true }).fill('A verified comment.');
  await submit.click();
  await expect(section.locator('[data-comment-status]')).toHaveText('Thanks! Your comment is awaiting review.');
  expect(posted).toHaveLength(1);
  expect(posted[0].turnstileToken).toBe('fresh-token');
  expect(await page.evaluate('window.__commentChallenge.resets')).toBe(1);
  await expect(submit).toBeDisabled();
  expect(challengeLoads).toBe(2);
});

test('a public hostname without a site key never enables comment submission', async ({ page }) => {
  const localOrigin = 'http://127.0.0.1:4321';
  await page.routeWebSocket('**', socket => socket.close());
  // Serve the local build under a synthetic public origin; no public network request is made.
  await page.route('https://comments-ui.example/**', async route => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${localOrigin}${url.pathname}${url.search}` });
    if (route.request().resourceType() === 'document') {
      const body = (await response.text()).replace(/data-turnstile-site-key(?:="[^"]*")?/, 'data-turnstile-site-key=""');
      return route.fulfill({ response, body });
    }
    return route.fulfill({ response });
  });
  await mockComments(page, route => route.fulfill({ json: { comments: [], nextCursor: null } }));
  await page.goto('https://comments-ui.example/sled-rider/');
  const section = page.locator('#comments');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('[data-comment-form]')).toBeVisible();
  await expect(section.getByRole('button', { name: 'Submit comment', exact: true })).toBeDisabled();
  await expect(section.locator('[data-challenge-status]')).toContainText(/temporarily unavailable/i);
  await page.unrouteAll({ behavior: 'wait' });
});

for (const slug of ['sled-rider', 'merge-christmas']) {
  test(`comment form and long public text fit the ${slug} theme on mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await mockComments(page, route => route.fulfill({ json: {
      comments: [{ ...comment(1, 'x'.repeat(300)), gameSlug: slug, nickname: '🎿'.repeat(40), reply: 'A reply '.repeat(30) }], nextCursor: null,
    } }));
    const section = await openComments(page, slug);
    await expect(section.locator('[data-comment-id]')).toHaveCount(1);
    await expect(section.getByLabel('Nickname', { exact: true })).toBeVisible();
    await expect(section.getByLabel('Your comment', { exact: true })).toBeVisible();
    await expect(section.getByRole('button', { name: 'Submit comment', exact: true })).toBeVisible();
    expect(await section.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    expect(await page.locator('html').evaluate(node => node.scrollWidth)).toBeLessThanOrEqual(320);
    const labels = section.locator('label');
    expect(await labels.count()).toBeGreaterThanOrEqual(2);
  });
}

test('without JavaScript, comments explain how to enable interaction and never expose a broken form', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await blockExternalResources(page);
    const section = await openComments(page);
    await expect(section.locator('noscript > p')).toHaveText('Enable JavaScript to read and submit comments.');
    await expect(section.locator('noscript > p')).toBeVisible();
    await expect(section.locator('[data-comment-form]')).toBeHidden();
  } finally {
    await context.close();
  }
});
