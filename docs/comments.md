# Game comments

Each game detail page has an English comment list and submission form at `#comments`. Visitors submit a nickname and text for that game. New comments are `pending`; only `approved` comments and their owner replies appear publicly. There are no visitor accounts, star ratings, likes, or threaded visitor replies.

The projects have separate responsibilities:

| Project | Responsibility |
| --- | --- |
| `sledgames` | Astro static pages, the comment UI, and a small Worker that forwards `/api/*` through the `COMMENTS_API` service binding. |
| `sled-games-server` | Comment API, validation, moderation, Turnstile verification, D1 storage, migrations, and scheduled rate-record cleanup. |

The browser always requests `/api/comments/` from the website's own origin. The frontend has no database binding or administrative secret. The backend uses its private `COMMENTS_DB` binding; production configuration disables its direct `workers.dev` and preview URLs. The production domain `sledgames.com` is attached to the `sledgames` Worker, which calls `sled-games-server` through the service binding in the same account. Local development remains separate from the production resources below.

## Local setup

Use Node.js 24, as specified in `.nvmrc`. The expected layout is two sibling checkouts:

```text
GTS/
  sledgames/
  sled-games-server/
```

In a backend terminal:

```sh
cd ../sled-games-server
npm ci
cp -n .dev.vars.example .dev.vars
openssl rand -hex 32
openssl rand -hex 32
```

Put the two independently generated values into the backend `.dev.vars` as `ADMIN_TOKEN` and `IP_HASH_SECRET`. Leave `COMMENTS_LOCAL_DEV=true` for local testing. Do not overwrite existing credentials or copy them into the frontend. Then run:

```sh
npm run migrate:local
npm run dev
```

The API listens on `http://127.0.0.1:8788`. Wrangler keeps local D1 data under `sled-games-server/.wrangler/state`; restarting the Worker preserves it. Although `wrangler.jsonc` now contains the production D1 ID, `npm run migrate:local` and `npm run dev` explicitly use local mode and do not create or modify a remote database.

In the frontend terminal, from `sledgames`:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4321/sled-rider/#comments`. Use trailing slashes on API paths in Astro development (for example `/api/comments/`), because this site's `trailingSlash: 'always'` middleware runs before the Vite proxy. Astro proxies `/api/*` to the backend on port 8788 while preserving the original request host and origin. Keep browser requests relative to the website; do not point the form directly at port 8788. Use an already-running Astro server on 4321 instead of starting a duplicate.

For the built-site Worker path, keep the backend running and run `PUBLIC_TURNSTILE_SITE_KEY= npm run dev:worker` in the frontend. The empty environment override prevents this local build from using the real widget key in `.env.production`, which is restricted to the production hostname. Open `http://127.0.0.1:8787/sled-rider/#comments`; Wrangler connects the frontend's `COMMENTS_API` binding to the local `sled-games-server` Worker. Rebuild after changing Astro pages. Neither mode deploys a Worker. A normal subsequent `npm run build` or `npm run deploy` uses the production key again.

With no public Turnstile site key, the browser enables local submissions only on `localhost`, `127.0.0.1`, or `[::1]`. The backend separately requires `COMMENTS_LOCAL_DEV=true` and a loopback hostname to bypass verification. This does not bypass administrator authentication or rate limiting. On a non-local hostname, a missing public site key leaves submission unavailable; the backend also rejects missing production security configuration.

### Keep the game catalog in sync

The backend validates slugs using its own `data/game-slugs.json`. After adding or removing frontend games, update that snapshot from the backend directory:

```sh
npm run sync:games -- ../sledgames/data/games.json
```

Review and commit the generated snapshot with the backend changes. Runtime requests do not read files from the frontend checkout.

## Configuration

| Setting | Location | Purpose |
| --- | --- | --- |
| `COMMENTS_API` | Frontend `wrangler.jsonc` service binding | Routes API requests to the `sled-games-server` Worker. |
| `PUBLIC_TURNSTILE_SITE_KEY` | Frontend `.env` locally; frontend build environment for production | Public widget key. It is included in the page and is not a secret. |
| `COMMENTS_DB` | Backend `wrangler.jsonc` D1 binding | Comment and rate-limit storage. Migrations live in the backend `migrations/` directory. |
| `ADMIN_TOKEN` | Backend `.dev.vars` locally; backend Worker secret in production | At least 32 random characters; required for all administrator routes. |
| `IP_HASH_SECRET` | Backend `.dev.vars` locally; backend Worker secret in production | At least 32 independently generated random characters; creates keyed IP hashes for rate limiting. |
| `TURNSTILE_SECRET_KEY` | Backend `.dev.vars` for challenge testing; backend Worker secret in production | Private verification secret. Never place it in a `PUBLIC_*` variable. |
| `COMMENTS_LOCAL_DEV` | Backend `.dev.vars` locally; backend `vars` in `wrangler.jsonc` | Local challenge bypass only. Production remains `false`. |

Keep secrets out of static assets, browser scripts, URLs, and commits. A missing service binding or unavailable backend produces HTTP 503. The backend also returns 503 for a missing database or submission security configuration. Administrator routes return 503 if `ADMIN_TOKEN` is missing or too short; missing or incorrect caller credentials return 401. Rotate `ADMIN_TOKEN` in the backend and the owner's trusted client. Rotating `IP_HASH_SECRET` starts fresh rate-limit identities; old records expire through cleanup.

## Public API

All API responses use `Cache-Control: no-store`. Text is plain text, not HTML or Markdown. Timestamps are ISO 8601 UTC strings, for example `2026-11-01T03:00:00.000Z`. Both paths with and without a final slash are accepted.

### Read approved comments

```sh
curl 'http://127.0.0.1:4321/api/comments/?gameSlug=sled-rider&limit=20'
```

```json
{
  "comments": [
    {
      "id": 12,
      "gameSlug": "sled-rider",
      "nickname": "SnowFan",
      "content": "The second jump took some practice!",
      "createdAt": "2026-11-01T03:00:00.000Z",
      "reply": "Thanks for sharing your tip.",
      "replyUpdatedAt": "2026-11-01T04:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

`gameSlug` is required and must match the backend snapshot in `sled-games-server/data/game-slugs.json`, generated from the frontend catalog. `limit` is an integer from 1 to 50, defaulting to 20. Results are ordered by descending comment ID (submission order). For another page, pass the returned `nextCursor` as `cursor` and keep the same filters. A null cursor means there are no more results. Cursors are positive integer IDs, not page numbers. Restart at the first page to refresh after moderation changes; approval does not change a comment's submission order. Pending/rejected comments and replies on those comments are never returned publicly.

### Submit a comment

This request works with the local Turnstile bypass described above:

```sh
curl -i 'http://127.0.0.1:4321/api/comments/' \
  -H 'Content-Type: application/json' \
  --data '{"gameSlug":"sled-rider","nickname":"SnowFan","content":"The second jump took some practice!","website":""}'
```

Successful submission returns HTTP 201 with `{"id":12,"status":"pending"}`. It does not immediately appear in the public list.

| Field | Validation |
| --- | --- |
| `gameSlug` | Required existing catalog slug. |
| `nickname` | Required text, 1–40 Unicode code points after trimming; no line breaks or control characters. |
| `content` | Required text, 1–2,000 Unicode code points after trimming; line breaks and tabs are allowed, other control characters are rejected. |
| `website` | Optional honeypot; omit it or send an empty string. |
| `turnstileToken` | Required outside the local bypass; a nonempty Turnstile token of at most 2,048 characters. |

The entire request must be a JSON object encoded as UTF-8 and no larger than 16 KiB. Unknown fields, including a caller-supplied `status`, `reply`, or `id`, are rejected. Malformed Unicode is rejected. The API does not interpret markup; any consuming UI must assign user text with `textContent`, not `innerHTML`.

Submissions have a shared limit across games of five attempts per IP in each fixed 10-minute window. The counter is stored in D1 and updated atomically, so it survives Worker restarts and concurrent requests. Attempts are counted before JSON and Turnstile validation; malformed input and failed challenges consume slots. Cross-origin requests are rejected before the counter is updated. HTTP 429 includes `Retry-After` in seconds. Multiple visitors sharing one public IP share this allowance.

The Worker uses the Cloudflare-provided client IP for a keyed HMAC hash. The rate-limit table stores the hash, window, attempt count, and expiry, separately from comments; it never stores the raw IP. Records expire 24 hours after their last accepted counter update and the hourly scheduled handler removes expired records, normally within 25 hours. Local Wrangler cron events do not run automatically; see validation below. Cloudflare may process raw request data separately for hosting and Turnstile.

## Owner moderation

The owner can use the single-account [administrator page](https://sledgames.com/admin/comments/); see [the administrator guide](admin-comments.md) for login and review steps. Browser requests use an HttpOnly session cookie, and changes also require a CSRF token and matching origin. The frontend never receives the administrative bearer token.

For trusted terminal or server-side moderation, the existing comment-management routes still accept `Authorization: Bearer <ADMIN_TOKEN>`. The examples below use that workflow. When an `Origin` header is supplied, it must match the API origin, including the port.

In Bash or Zsh, enter the local administrator token without echoing it or placing it in the command history:

```sh
read -rs COMMENTS_ADMIN_TOKEN
```

List the pending queue (the default status), or explicitly filter by `pending`, `approved`, `rejected`, or `all`. An optional `gameSlug` narrows the queue; pagination uses the same `limit` and `cursor` rules as public reads.

```sh
curl 'http://127.0.0.1:4321/api/admin/comments/?status=pending&limit=20' \
  -H "Authorization: Bearer $COMMENTS_ADMIN_TOKEN"
```

The response shape is `{ "comments": [...], "nextCursor": null }`. Administrator comment objects include the public fields plus `status` and `updatedAt`. Approve and optionally reply to a comment using its returned ID:

```sh
curl -X PATCH 'http://127.0.0.1:4321/api/admin/comments/12/' \
  -H "Authorization: Bearer $COMMENTS_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"status":"approved","reply":"Thanks for sharing your tip."}'
```

PATCH returns `{ "comment": { ... } }`. Supply at least one of `status` or `reply`; omitted fields stay unchanged. Status may be `pending`, `approved`, or `rejected`. A reply is plain text of 1–2,000 Unicode code points after trimming. Set `reply` to `null` to remove it; an empty string is invalid. Only one owner reply is stored per comment. Replies can be prepared while a comment is pending and become visible only after approval.

Set `status` to `rejected` to hide a comment while retaining it in the management queue, or back to `pending` to reconsider it. DELETE permanently removes the comment and its reply from the live database:

```sh
curl -i -X DELETE 'http://127.0.0.1:4321/api/admin/comments/12/' \
  -H "Authorization: Bearer $COMMENTS_ADMIN_TOKEN"
unset COMMENTS_ADMIN_TOKEN
```

Successful deletion returns HTTP 204 with no body. Updating or deleting an unknown ID returns 404. There is no audit history or moderator account system in this version; `updatedAt` records the most recent modification. Review pending and rejected entries periodically and remove content that should not be retained. The privacy and terms pages describe comment handling and how visitors can contact the owner about removal.

## Comment interface and Turnstile

`GameComments.astro` is included on every game detail page. The list requests 10 approved comments at a time. It provides loading, empty, retry, and load-more states. Owner replies are labeled **Sled Games reply**. User text is rendered with `textContent`, preserving line breaks without interpreting HTML.

The form accepts a nickname and comment, with character limits matching the backend. While a request is in flight, duplicate submission is disabled. Validation and server failures preserve the visitor's text. HTTP 429 shows a retry delay. A successful POST displays **Thanks! Your comment is awaiting review.** The pending comment is not inserted into the approved list. A network failure can have an uncertain result, so the interface does not automatically retry the POST. There is a JavaScript-required message when scripting is disabled.

The production Turnstile widget is named **Sled Games comments**, uses managed mode, and allows `sledgames.com`. Its public site key is supplied through the frontend `PUBLIC_TURNSTILE_SITE_KEY` variable; its private secret belongs in the backend `TURNSTILE_SECRET_KEY`. The widget uses action `comment` and English text. The frontend loads the widget when the comment area is needed and sends its token in `turnstileToken`; the backend requires successful verification, the exact website request hostname, and the expected action. The service binding preserves the website request URL. Configure an appropriate widget and hostname allowance separately when testing challenges on another hostname.

Turnstile tokens expire after five minutes and can only be validated once. The UI handles expiry and challenge errors, and resets the widget after submission attempts. Restart Astro after changing local environment values; rebuild static pages when changing the public site key for a release. The frontend must never receive `ADMIN_TOKEN`, `IP_HASH_SECRET`, or `TURNSTILE_SECRET_KEY`.

Errors use `{ "error": { "code": "...", "message": "..." } }`. The main HTTP statuses are 400 for invalid input/challenge, 401 for invalid admin credentials, 403 for disallowed origin, 404 for unknown game/comment/endpoint, 405 for unsupported method, 413 for oversized bodies, 415 for non-JSON bodies, 429 for rate limiting, and 503 for missing configuration or unavailable services. A failed or unavailable challenge never creates a comment.

## Production configuration and deployment

The following resources were configured in the authorized release on 2026-11-01:

| Resource | Configuration |
| --- | --- |
| Cloudflare account | `3d8d0e849d5e1ee4e18a56ff1e25472a`, pinned in both Wrangler configurations. |
| Public website | `https://sledgames.com`, served by Worker `sledgames`. |
| Comment backend | Worker `sled-games-server`, reached through `COMMENTS_API`; direct public Worker URLs are disabled. |
| D1 database | `sledgames-comments`, ID `fdb41164-d92e-44be-8684-ab1a9a3ff829`, bound as `COMMENTS_DB`. |
| Primary data region | WNAM (Western North America), reported by Cloudflare when the database was created. |
| Initial migration | `0001_comments.sql` applied to the remote database. |
| Turnstile | **Sled Games comments**, managed mode, allowed domain `sledgames.com`. |

The 2026-11-01 release was verified on the live domain: a real browser passed Turnstile and submitted a pending comment; the moderation API approved it with an owner reply, rejected it, and deleted the temporary record. Public reads hid pending/rejected comments and showed the approved reply. Anonymous administration, cross-origin submission, and an invalid challenge were rejected. The home page, game page, trailing-slash redirect, and 404 page also passed checks. Evidence is saved under `artifacts/comments-ui/production-*.json`; the hourly cron configuration was confirmed, but its next scheduled execution was not awaited.

Production comments, moderation status, owner replies, and temporary rate-limit records live in this Cloudflare D1 database. They are independent of the local `.wrangler/state` database and are not bundled into the static website. To inspect the data, select the account in the [Cloudflare dashboard](https://dash.cloudflare.com/), then open **Storage & databases → D1 → sledgames-comments**. The application tables are `comments` and `comment_rate_limits`. Use the authenticated moderation API for routine approval and replies.

This machine keeps the public build key in the frontend's ignored `.env.production`. The backend's ignored `.env.production.secrets`, with file permissions `600`, contains `ADMIN_TOKEN`, `IP_HASH_SECRET`, `TURNSTILE_SECRET_KEY`, and the administrator login's `ADMIN_PASSWORD_HASH`. Keep a protected copy in trusted credential storage. The separate `.env.admin-login` file contains the owner's initial username/password and must never be uploaded as Worker secrets. Do not copy the local `.dev.vars` into production or pass it to `secret bulk` or `--secrets-file`: it contains `COMMENTS_LOCAL_DEV=true`. The production Wrangler setting remains `false`.

For an authorized release:

1. Verify the account, existing resources, and game-slug snapshot. Reuse this database; do not create a new one for each deployment. Preserve applied migration files and add new files for future schema changes.
2. Run the checks below. Dry runs bundle the projects without publishing and do not validate remote bindings, secrets, database contents, or domain routing.
3. In `sled-games-server`, apply any new migrations and deploy the backend:

   ```sh
   npx wrangler d1 migrations apply COMMENTS_DB --remote
   npx wrangler deploy --secrets-file .env.production.secrets
   ```

   This command uploads the production secrets with the Worker version and configures the hourly cleanup trigger. For later code-only deployments, `npm run deploy` preserves existing Worker secrets. Update individual secrets with `npx wrangler secret put NAME` when intentionally rotating them. Deployment alone does not apply migrations.
4. In `sledgames`, run `npm run deploy`. It builds the static site with `.env.production` and publishes the frontend. For CI or another machine, supply `PUBLIC_TURNSTILE_SITE_KEY` in that build environment; Git does not transfer the ignored environment file. Restore backend credentials only from trusted storage if they need to be uploaded; never place private keys in the frontend build environment.
5. Verify the real website's submit → pending → owner approval/reply → public read flow, existing pages, rejected challenges, and unauthorized admin requests. Remove only the temporary comments created for verification. Check scheduled-event outcomes after the cron has run.

Only the frontend receives browser requests. Administrative routes remain protected by the backend Bearer token. No build, test, or local migration command publishes either project.

Before a schema change or a bulk data correction, export a backup from the backend directory using a unique output filename:

```sh
umask 077
mkdir -p .wrangler/backups
npx wrangler d1 export COMMENTS_DB --remote --output=.wrangler/backups/comments-before-migration.sql
```

The export contains private pending and rejected comments as well as public data. Keep it in protected storage and out of Git and static assets. Review Cloudflare's [D1 export instructions](https://developers.cloudflare.com/d1/best-practices/import-export-data/) and [Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/) when planning backup and recovery; a Worker rollback does not restore database contents.

## Validation and operations

With the backend on 8788, Astro on 4321 and the frontend Worker on 8787 running, `npm run verify:comments:local` exercises the real browser submission, moderation, reply and removal flow through both frontends. It reads the backend's local `.dev.vars` on the Node side, deletes only its own test comments, and saves screenshots and results under `artifacts/comments-ui/`. It requires a locally installed Google Chrome. Run it with the local Turnstile bypass; production challenge behavior is checked separately in browser tests with simulated challenge responses.

From `sledgames`:

```sh
npm run verify
npm run test:browser -- tests/browser/comments.spec.ts
npm run deploy:check
```

From `sled-games-server`:

```sh
npm test
npm run deploy:check
```

Frontend verification checks static pages and the API proxy. Browser tests cover rendering, pagination, input handling, and failure states. Backend tests exercise the Worker with local D1 storage, including moderation visibility, authentication, validation, persistence, concurrent rate limiting, and cleanup; challenge responses are simulated without contacting a real Turnstile service.

For manual end-to-end validation, submit a comment from a local game page, confirm it is absent from the public list, approve it and add a reply through the administrator API, then reload the page. Rejection should hide it again. Delete temporary test comments after checking. Test a second game to confirm lists are isolated by slug.

Local cron events do not fire automatically. With the backend development server running, invoke its scheduled route:

```sh
curl 'http://127.0.0.1:8788/cdn-cgi/local/scheduled?cron=0+*+*+*+*&format=json'
```

Check for `outcome: "ok"`. Monitor failed scheduled events and request errors in production. A 503 commonly indicates a missing service binding, backend process, secret, or database migration. Diagnostic logs avoid comment text, tokens, IP addresses, and SQL values. Comments remain until the owner deletes them; the scheduled handler only removes expired rate-limit records.

Official references: [Worker scripts with static assets](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), [HTTP service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/http/), [local multiple Workers](https://developers.cloudflare.com/workers/local-development/multi-workers/), [D1](https://developers.cloudflare.com/d1/), [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), and [testing scheduled handlers](https://developers.cloudflare.com/workers/configuration/cron-triggers/#test-cron-triggers-locally).
