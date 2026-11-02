# Comment administration

Open **https://sledgames.com/admin/comments/** to review player comments. The interface is in English and has one administrator account, `admin`. There is no public registration or additional administrator role.

Released on 2026-11-01. Local browser validation covered password login, reply saving, approval, status filtering, and public visibility; API checks covered logout revocation and cleanup. Production checks confirmed the page, security headers, unauthenticated rejection, challenge enforcement, and preservation of the owner's pending comment. The owner's first production password login has not been performed by the release checks. Results are in `artifacts/comments-ui/admin-local-integration.json` and `admin-production-checks.json`.

The initial login details are kept on the owner's machine in the backend's ignored `.env.admin-login` file, with file permissions `600`. Copy the password into the login form and keep it in your password manager. Do not commit this file, send its contents in a chat, or put it in the frontend. The deployed backend receives only a salted password hash, not the plaintext password.

## Review comments

1. Sign in with your username and password and complete the security check if prompted.
2. Start with **Pending**. Filter by game or switch to approved, rejected, or all comments as needed.
3. **Approve** publishes the comment on its own game's page. **Reject** hides it while retaining it for review. Returning a comment to pending also hides it.
4. Save an owner reply when useful. A reply is public only while its comment is approved. Saving a reply does not approve the comment automatically.
5. Delete only comments you intend to permanently remove. The page asks for confirmation before deleting the comment and its reply.
6. Use **Sign out** when finished, especially on a shared computer.

Each game's public list is separate. A comment submitted on Ski King appears on Ski King after approval, not on another game's page. Refresh the public game page after moderation to load the latest list.

## Authentication

The frontend renders the interface and calls same-origin `/api/admin/*` endpoints. `sled-games-server` authenticates the single account and performs all database changes. Private comment data is never embedded in the static HTML.

Browser sessions use a random opaque cookie with `HttpOnly`, `Secure`, and `SameSite=Strict` in production. The database stores a hash of the session token. Sessions expire after eight hours; sign-out revokes the session immediately. Cookie-authenticated changes require the original website origin and a CSRF token held only in the page's memory. Password or account-name rotation invalidates existing sessions.

Login attempts use Turnstile and an IP-based limit separate from public comment submissions. The page never stores passwords, bearer tokens, or session cookies in browser local storage. The administrator page has no advertising or analytics scripts and is excluded from the sitemap and search indexing.

The existing `ADMIN_TOKEN` remains available for trusted terminal operations; it is never sent to the administrator page. See [the API documentation](comments.md#owner-moderation) for those operations.

## Local development and releases

Run both projects as described in [the comments guide](comments.md#local-setup). The backend needs `ADMIN_USERNAME` and a valid `ADMIN_PASSWORD_HASH` for login, in addition to its existing local configuration. Use separate local credentials. The local Turnstile bypass requires both `COMMENTS_LOCAL_DEV=true` and a loopback hostname; it does not disable password checks or CSRF protection.

For production, apply the `0002_admin_sessions.sql` migration, upload the backend password hash as a Worker secret, deploy the backend, then build and deploy the frontend. Reuse the existing D1 database and public Turnstile site key. The backend's scheduled cleanup also removes expired administrator sessions.

Never upload `.env.admin-login` or the local `.dev.vars` as production secrets. Only the backend's `.env.production.secrets` is intended for `wrangler deploy --secrets-file`. Keep `ADMIN_USERNAME=admin` and `COMMENTS_LOCAL_DEV=false` in the production Worker configuration.

If you lose the password, generate a new password and salted hash, update `ADMIN_PASSWORD_HASH` on the backend Worker, and retain the new password in trusted storage. This also signs out existing sessions. Changing only the local plaintext login file does not change the deployed password.
