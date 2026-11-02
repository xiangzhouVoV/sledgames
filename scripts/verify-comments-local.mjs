import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Run only against local services. Read the admin secret on the Node side, never in the browser.
process.loadEnvFile(new URL('../../sled-games-server/.dev.vars', import.meta.url));
const backend = 'http://127.0.0.1:8788';
const artifactDir = new URL('../artifacts/comments-ui/', import.meta.url);
await mkdir(artifactDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const checks = [];
const ids = [];
async function administer(id, method, body) {
  const response = await fetch(`${backend}/api/admin/comments/${id}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, method === 'DELETE' ? 204 : 200);
}
try {
  for (const port of [4321, 8787]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.route(/^https:\/\//, route => route.abort());
    await page.goto(`http://127.0.0.1:${port}/sled-rider/#comments`);
    const section = page.locator('#comments');
    await section.scrollIntoViewIfNeeded();
    await section.getByLabel('Nickname', { exact: true }).fill('Local integration check');
    await section.getByLabel('Your comment', { exact: true }).fill(`Local integration test on port ${port}: this comment is removed after verification.`);
    const submitted = page.waitForResponse(response => new URL(response.url()).pathname === '/api/comments/' && response.request().method() === 'POST');
    await section.getByRole('button', { name: 'Submit comment', exact: true }).click();
    const response = await submitted;
    assert.equal(response.status(), 201, await response.text());
    const { id, status } = await response.json();
    ids.push(id);
    assert.equal(status, 'pending');
    await section.locator('[data-comment-status]').filter({ hasText: 'Thanks! Your comment is awaiting review.' }).waitFor();
    assert.equal(await section.locator(`[data-comment-id="${id}"]`).count(), 0);
    const pending = await (await fetch(`${backend}/api/comments?gameSlug=sled-rider`)).json();
    assert.ok(!pending.comments.some(comment => comment.id === id));
    await administer(id, 'PATCH', { status: 'approved', reply: 'Local moderator reply: approval and replies are working.' });
    await page.reload();
    await section.scrollIntoViewIfNeeded();
    const visible = section.locator(`[data-comment-id="${id}"]`);
    await visible.waitFor();
    assert.match(await visible.innerText(), /Sled Games reply/);
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
    if (port === 4321) await section.screenshot({ path: new URL('sled-rider-desktop.png', artifactDir).pathname });
    await administer(id, 'PATCH', { status: 'rejected' });
    const reloaded = page.waitForResponse(response => new URL(response.url()).pathname === '/api/comments/' && response.request().method() === 'GET');
    await page.reload();
    await section.scrollIntoViewIfNeeded();
    assert.ok(!(await (await reloaded).json()).comments.some(comment => comment.id === id));
    assert.equal(await section.locator(`[data-comment-id="${id}"]`).count(), 0);
    await administer(id, 'DELETE');
    ids.splice(ids.indexOf(id), 1);
    if (port === 4321) {
      await page.setViewportSize({ width: 390, height: 844 });
      const christmasLoaded = page.waitForResponse(response => new URL(response.url()).pathname === '/api/comments/' && response.request().method() === 'GET');
      await page.goto('http://127.0.0.1:4321/merge-christmas/#comments');
      await page.locator('#comments').scrollIntoViewIfNeeded();
      assert.equal((await christmasLoaded).status(), 200);
      await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
      await page.locator('#comments').screenshot({ path: new URL('christmas-mobile.png', artifactDir).pathname });
    }
    checks.push({ port, submitted: 201, pendingHidden: true, approvedReplyVisible: true, rejectionHidden: true, deleted: 204 });
    await context.close();
  }
  await writeFile(new URL('local-integration.json', artifactDir), JSON.stringify({ verifiedAt: new Date().toISOString(), backendProject: 'sled-games-server', checks }, null, 2) + '\n');
  console.log('Passed real browser → frontend → sled-games-server → D1 flows on ports 4321 and 8787. Test comments deleted.');
} finally {
  for (const id of ids) await administer(id, 'DELETE');
  await browser.close();
}
