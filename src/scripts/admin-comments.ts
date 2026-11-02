export {};

type CommentStatus = 'pending' | 'approved' | 'rejected';
interface AdminSession { authenticated: true; username: string; csrfToken: string }
interface AdminComment {
  id: number; gameSlug: string; nickname: string; content: string; status: CommentStatus;
  createdAt: string; updatedAt: string; reply: string | null; replyUpdatedAt: string | null;
}
interface CommentPage { comments: AdminComment[]; nextCursor: number | null }
interface AdminTurnstile {
  ready(callback: () => void): void;
  render(container: HTMLElement, options: {
    sitekey: string; action: string; language: 'en'; theme: 'light'; size: 'normal' | 'compact';
    'response-field': boolean; callback: (token: string) => void;
    'expired-callback': () => void; 'timeout-callback': () => void; 'error-callback': () => boolean;
  }): string | undefined;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}
class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

const root = document.querySelector<HTMLElement>('[data-admin-comments]');
if (root) initializeAdmin(root);

function initializeAdmin(root: HTMLElement) {
  const element = <T extends HTMLElement>(selector: string): T => {
    const found = root.querySelector<T>(selector);
    if (!found) throw new Error('The administration interface is incomplete.');
    return found;
  };
  const startPanel = element<HTMLElement>('[data-session-loading]');
  const startStatus = element<HTMLElement>('[data-session-status]');
  const sessionRetry = element<HTMLButtonElement>('[data-session-retry]');
  const loginPanel = element<HTMLElement>('[data-login-panel]');
  const loginForm = element<HTMLFormElement>('[data-login-form]');
  const username = element<HTMLInputElement>('#admin-username');
  const password = element<HTMLInputElement>('#admin-password');
  const loginButton = element<HTMLButtonElement>('[data-login-submit]');
  const loginStatus = element<HTMLElement>('[data-login-status]');
  const challenge = element<HTMLElement>('[data-admin-challenge]');
  const challengeStatus = element<HTMLElement>('[data-challenge-status]');
  const challengeRetry = element<HTMLButtonElement>('[data-challenge-retry]');
  const workspace = element<HTMLElement>('[data-workspace]');
  const workspaceStatus = element<HTMLElement>('[data-workspace-status]');
  const accountName = element<HTMLElement>('[data-admin-name]');
  const logoutButton = element<HTMLButtonElement>('[data-logout]');
  const statusFilter = element<HTMLSelectElement>('[data-status-filter]');
  const gameFilter = element<HTMLSelectElement>('[data-game-filter]');
  const refreshButton = element<HTMLButtonElement>('[data-refresh]');
  const listHeading = element<HTMLElement>('[data-list-heading]');
  const listCount = element<HTMLElement>('[data-list-count]');
  const listMessage = element<HTMLElement>('[data-list-message]');
  const listRetry = element<HTMLButtonElement>('[data-list-retry]');
  const list = element<HTMLOListElement>('[data-comment-list]');
  const more = element<HTMLButtonElement>('[data-load-more]');
  const gameTitles = new Map(Array.from(gameFilter.options).filter(o => o.value).map(o => [o.value, o.text]));
  const siteKey = root.dataset.turnstileSiteKey ?? '';
  const localBypass = !siteKey && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const turnstileWindow = window as unknown as { turnstile?: AdminTurnstile };
  const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
  let session: AdminSession | null = null;
  let authGeneration = 0;
  let listGeneration = 0;
  let listController: AbortController | undefined;
  let cursor: number | null = null;
  let loading = false;
  let retryAppend = false;
  let loggingIn = false;
  let signingOut = false;
  let checkingSession = false;
  let challengeToken = '';
  let widgetId: string | undefined;
  let challengeLoading = false;
  let turnstileLoading: Promise<AdminTurnstile> | undefined;
  const records = new Map<number, AdminComment>();
  const drafts = new Map<number, string>();
  const mutations = new Set<number>();

  const feedback = (target: HTMLElement, message: string, error = false) => {
    target.textContent = message;
    target.dataset.error = String(error);
  };
  const errorMessage = (error: unknown, mutation = false) => error instanceof ApiError ? error.message : mutation
    ? 'The request could not be confirmed. Refresh to check its result before trying again.'
    : 'The request could not be completed. Please try again.';

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener('abort', abort, { once: true });
    const timeout = window.setTimeout(abort, 20000);
    try {
      const response = await fetch(path, { ...options, credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) {
        throw new ApiError(typeof data?.error?.message === 'string' ? data.error.message : 'The request was not accepted.', response.status);
      }
      return data as T;
    } finally {
      window.clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
    }
  }

  function syncControls() {
    const busy = mutations.size > 0 || signingOut;
    statusFilter.disabled = busy;
    gameFilter.disabled = busy;
    refreshButton.disabled = busy || loading;
    more.disabled = busy || loading;
    listRetry.disabled = busy || loading;
    logoutButton.disabled = busy;
    loginButton.disabled = loggingIn || (!localBypass && !challengeToken);
    loginButton.textContent = loggingIn ? 'Signing in…' : 'Sign in';
    logoutButton.textContent = signingOut ? 'Signing out…' : 'Sign out';
  }

  function clearPrivateState() {
    authGeneration++;
    listGeneration++;
    listController?.abort();
    session = null;
    records.clear(); drafts.clear(); mutations.clear();
    list.replaceChildren();
    cursor = null; loading = false; signingOut = false;
    accountName.textContent = '';
    listCount.textContent = '';
    feedback(workspaceStatus, '');
    listMessage.textContent = '';
    more.hidden = true; listRetry.hidden = true;
    workspace.hidden = true;
    password.value = '';
    syncControls();
  }

  function showLogin(message = '') {
    clearPrivateState();
    startPanel.hidden = true;
    loginPanel.hidden = false;
    feedback(loginStatus, message);
    void startChallenge();
  }

  function expired(error: unknown): boolean {
    if (error instanceof ApiError && error.status === 401) {
      showLogin('Your session has ended. Sign in again to continue.');
      return true;
    }
    return false;
  }

  function enterWorkspace(next: AdminSession) {
    clearPrivateState();
    session = next;
    accountName.textContent = next.username;
    loginPanel.hidden = true;
    startPanel.hidden = true;
    workspace.hidden = false;
    password.value = '';
    challengeToken = '';
    if (widgetId !== undefined) turnstileWindow.turnstile?.remove(widgetId);
    widgetId = undefined;
    statusFilter.value = 'pending';
    gameFilter.value = '';
    void loadComments();
  }

  async function checkSession() {
    if (checkingSession || loggingIn || signingOut || mutations.size) return;
    checkingSession = true;
    const generation = authGeneration;
    sessionRetry.hidden = true;
    startStatus.textContent = 'Checking your session…';
    try {
      const next = await request<AdminSession>('/api/admin/session/');
      if (generation !== authGeneration) return;
      if (!next.authenticated || !next.csrfToken) throw new Error('Session unavailable');
      if (session) { session = next; accountName.textContent = next.username; }
      else enterWorkspace(next);
    } catch (error) {
      if (generation !== authGeneration) return;
      if (error instanceof ApiError && error.status === 401) {
        showLogin(session ? 'Your session has ended. Sign in again to continue.' : '');
      } else if (session) {
        feedback(workspaceStatus, 'Your session could not be checked. Refresh before making changes.', true);
      } else {
        startPanel.hidden = false;
        loginPanel.hidden = true;
        startStatus.textContent = errorMessage(error);
        sessionRetry.hidden = false;
      }
    } finally { checkingSession = false; }
  }

  function loadTurnstile(): Promise<AdminTurnstile> {
    if (turnstileWindow.turnstile) return Promise.resolve(turnstileWindow.turnstile);
    if (turnstileLoading) return turnstileLoading;
    turnstileLoading = new Promise<AdminTurnstile>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      const fail = () => { window.clearTimeout(timeout); script.remove(); reject(new Error('Security check unavailable')); };
      const timeout = window.setTimeout(fail, 15000);
      script.addEventListener('error', fail, { once: true });
      script.addEventListener('load', () => {
        const api = turnstileWindow.turnstile;
        if (!api) return fail();
        api.ready(() => { window.clearTimeout(timeout); resolve(api); });
      }, { once: true });
      document.head.append(script);
    }).catch(error => { turnstileLoading = undefined; throw error; });
    return turnstileLoading;
  }

  async function startChallenge() {
    if (localBypass) { challengeStatus.textContent = ''; syncControls(); return; }
    if (!siteKey) { challengeStatus.textContent = 'Sign in is unavailable. The security check has not been configured.'; return; }
    if (widgetId !== undefined || challengeLoading || loginPanel.hidden) return;
    challengeLoading = true;
    challengeRetry.hidden = true;
    challengeStatus.textContent = 'Loading security check…';
    const failed = (message: string) => {
      challengeToken = ''; challengeStatus.textContent = message; challengeRetry.hidden = false; syncControls();
    };
    try {
      const api = await loadTurnstile();
      if (loginPanel.hidden) return;
      widgetId = api.render(challenge, {
        sitekey: siteKey, action: 'admin_login', language: 'en', theme: 'light',
        size: challenge.clientWidth < 300 ? 'compact' : 'normal', 'response-field': false,
        callback: token => { challengeToken = token; challengeStatus.textContent = ''; challengeRetry.hidden = true; syncControls(); },
        'expired-callback': () => failed('Your security check expired. Complete it again.'),
        'timeout-callback': () => failed('Your security check timed out. Please try again.'),
        'error-callback': () => { failed('The security check could not be completed. Please try again.'); return true; },
      });
      if (widgetId === undefined) throw new Error('Security check unavailable');
      if (!challengeToken) challengeStatus.textContent = 'Complete the security check to sign in.';
    } catch { failed('The security check could not be loaded. Please try again.'); }
    finally { challengeLoading = false; }
  }

  function resetChallenge() {
    challengeToken = '';
    if (widgetId !== undefined && turnstileWindow.turnstile) {
      turnstileWindow.turnstile.reset(widgetId);
      challengeStatus.textContent = 'Complete the security check to sign in.';
    } else void startChallenge();
    syncControls();
  }

  challengeRetry.addEventListener('click', () => {
    if (widgetId !== undefined) turnstileWindow.turnstile?.remove(widgetId);
    widgetId = undefined; challengeToken = '';
    syncControls(); void startChallenge();
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (loggingIn || (!localBypass && !challengeToken) || !loginForm.reportValidity()) return;
    loggingIn = true;
    const generation = authGeneration;
    feedback(loginStatus, ''); syncControls();
    try {
      const next = await request<AdminSession>('/api/admin/login/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.value.trim(), password: password.value, turnstileToken: challengeToken }),
      });
      if (generation !== authGeneration) return;
      if (!next.authenticated || !next.csrfToken) throw new Error('Session unavailable');
      enterWorkspace(next);
    } catch (error) {
      if (generation !== authGeneration) return;
      feedback(loginStatus, errorMessage(error), true);
      resetChallenge();
    } finally {
      loggingIn = false; password.value = ''; syncControls();
    }
  });

  logoutButton.addEventListener('click', async () => {
    if (!session || signingOut || mutations.size) return;
    signingOut = true;
    const generation = authGeneration;
    const csrfToken = session.csrfToken;
    syncControls(); feedback(workspaceStatus, '');
    try {
      await request<null>('/api/admin/logout/', { method: 'POST', headers: { 'X-CSRF-Token': csrfToken } });
      if (generation === authGeneration) showLogin('You have been signed out.');
    } catch (error) {
      if (generation !== authGeneration || expired(error)) return;
      feedback(workspaceStatus, 'Sign out could not be confirmed. Please try again.', true);
    } finally { signingOut = false; syncControls(); }
  });

  function updateListSummary() {
    listCount.textContent = records.size ? `${records.size} ${records.size === 1 ? 'comment' : 'comments'} loaded` : '';
    more.hidden = cursor === null;
    if (!records.size && !loading) {
      const state = statusFilter.value === 'all' ? 'comments' : `${statusFilter.value} comments`;
      listMessage.textContent = `No ${state} for this selection.`;
    } else if (!loading) listMessage.textContent = '';
  }

  async function loadComments(append = false) {
    if (!session || mutations.size || signingOut || (append && (loading || cursor === null))) return;
    const generation = ++listGeneration;
    const auth = authGeneration;
    listController?.abort();
    listController = new AbortController();
    loading = true; retryAppend = append;
    listRetry.hidden = true;
    feedback(workspaceStatus, '');
    listHeading.textContent = statusFilter.value === 'all' ? 'All comments' : `${statusFilter.value[0].toUpperCase()}${statusFilter.value.slice(1)} comments`;
    if (!append) { records.clear(); list.replaceChildren(); cursor = null; listCount.textContent = ''; more.hidden = true; }
    listMessage.textContent = append ? 'Loading more comments…' : 'Loading comments…';
    list.setAttribute('aria-busy', 'true'); syncControls();
    const params = new URLSearchParams({ status: statusFilter.value, limit: '20' });
    if (gameFilter.value) params.set('gameSlug', gameFilter.value);
    if (append && cursor !== null) params.set('cursor', String(cursor));
    try {
      const data = await request<CommentPage>(`/api/admin/comments/?${params}`, { signal: listController.signal });
      if (generation !== listGeneration || auth !== authGeneration) return;
      for (const comment of data.comments) {
        if (records.has(comment.id)) continue;
        records.set(comment.id, comment); list.append(commentCard(comment));
      }
      cursor = data.nextCursor; loading = false; updateListSummary();
    } catch (error) {
      if (generation !== listGeneration || auth !== authGeneration || expired(error)) return;
      listMessage.textContent = errorMessage(error);
      listRetry.hidden = false;
    } finally {
      if (generation === listGeneration && auth === authGeneration) {
        loading = false; list.setAttribute('aria-busy', 'false'); syncControls();
      }
    }
  }

  function commentCard(comment: AdminComment): HTMLLIElement {
    const card = document.createElement('li'); card.className = 'admin-comment-card'; card.dataset.commentId = String(comment.id);
    const top = document.createElement('div'); top.className = 'admin-comment-top';
    const identity = document.createElement('div');
    const name = document.createElement('h3'); name.textContent = comment.nickname;
    const meta = document.createElement('div'); meta.className = 'admin-comment-meta';
    const game = document.createElement('a'); game.className = 'admin-comment-game';
    game.textContent = gameTitles.get(comment.gameSlug) ?? comment.gameSlug;
    game.href = `/${encodeURIComponent(comment.gameSlug)}/#comments`; game.target = '_blank'; game.rel = 'noopener noreferrer';
    const date = document.createElement('time');
    const parsedDate = new Date(comment.createdAt);
    if (Number.isFinite(parsedDate.getTime())) { date.dateTime = parsedDate.toISOString(); date.textContent = dateFormat.format(parsedDate); }
    else date.textContent = 'Date unavailable';
    const id = document.createElement('span'); id.textContent = `#${comment.id}`;
    meta.append(game, date, id); identity.append(name, meta);
    const badge = document.createElement('span'); badge.className = 'admin-status'; badge.dataset.status = comment.status;
    badge.textContent = comment.status[0].toUpperCase() + comment.status.slice(1);
    top.append(identity, badge);
    const content = document.createElement('p'); content.className = 'admin-comment-content'; content.textContent = comment.content;
    const actions = document.createElement('div'); actions.className = 'admin-comment-actions';
    const message = document.createElement('p'); message.className = 'admin-feedback'; message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
    const action = (label: string, run: () => void, classes = '') => {
      const button = document.createElement('button'); button.type = 'button'; button.className = `admin-button ${classes}`; button.textContent = label;
      button.addEventListener('click', run); return button;
    };
    if (comment.status !== 'approved') actions.append(action('Approve', () => void mutate(comment.id, 'PATCH', { status: 'approved' }), 'admin-button--primary'));
    if (comment.status !== 'rejected') actions.append(action('Reject', () => void mutate(comment.id, 'PATCH', { status: 'rejected' })));
    if (comment.status !== 'pending') actions.append(action('Return to pending', () => void mutate(comment.id, 'PATCH', { status: 'pending' })));
    actions.append(action('Delete', () => {
      if (window.confirm(`Permanently delete comment #${comment.id} and its reply? This cannot be undone.`)) void mutate(comment.id, 'DELETE');
    }, 'admin-button--danger admin-delete'));
    const reply = document.createElement('div'); reply.className = 'admin-reply';
    const label = document.createElement('label'); label.htmlFor = `admin-reply-${comment.id}`; label.textContent = 'Owner reply';
    const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'admin-reply-input'; input.rows = 3;
    input.value = drafts.get(comment.id) ?? comment.reply ?? '';
    input.placeholder = 'Write a helpful reply…';
    input.setAttribute('aria-describedby', `admin-reply-help-${comment.id}`);
    const help = document.createElement('p'); help.className = 'admin-help'; help.id = `admin-reply-help-${comment.id}`;
    const replyBottom = document.createElement('div'); replyBottom.className = 'admin-reply-bottom';
    const replyButtons = document.createElement('div'); replyButtons.className = 'admin-reply-buttons';
    const save = action('Save reply', () => {
      const text = input.value.trim();
      if (!text || [...text].length > 2000) { feedback(message, 'Write a reply of 1–2,000 characters.', true); input.focus(); return; }
      void mutate(comment.id, 'PATCH', { reply: text });
    });
    const syncReply = () => {
      const count = [...input.value].length;
      help.textContent = `${count} / 2,000 · Visible when approved`;
      save.disabled = !input.value.trim() || count > 2000 || input.value.trim() === (comment.reply ?? '');
    };
    input.addEventListener('input', () => {
      if (input.value === (comment.reply ?? '')) drafts.delete(comment.id);
      else drafts.set(comment.id, input.value);
      syncReply();
    });
    syncReply(); replyButtons.append(save);
    if (comment.reply !== null) replyButtons.append(action('Remove reply', () => {
      if (window.confirm(`Remove the saved owner reply from comment #${comment.id}?`)) void mutate(comment.id, 'PATCH', { reply: null });
    }));
    replyBottom.append(help, replyButtons); reply.append(label, input, replyBottom);
    card.append(top, content, actions, reply, message);
    return card;
  }

  async function mutate(id: number, method: 'PATCH' | 'DELETE', body?: { status?: CommentStatus; reply?: string | null }) {
    if (!session || mutations.has(id) || signingOut || loading) return;
    const card = list.querySelector<HTMLElement>(`[data-comment-id="${id}"]`);
    if (!card) return;
    const message = card.querySelector<HTMLElement>('.admin-feedback')!;
    const controls = Array.from(card.querySelectorAll<HTMLButtonElement | HTMLTextAreaElement>('button, textarea'));
    const previousDisabled = controls.map(control => control.disabled);
    const generation = authGeneration;
    const csrfToken = session.csrfToken;
    mutations.add(id); controls.forEach(control => { control.disabled = true; });
    card.setAttribute('aria-busy', 'true'); feedback(message, 'Saving…'); feedback(workspaceStatus, ''); syncControls();
    try {
      const result = await request<{ comment: AdminComment } | null>(`/api/admin/comments/${id}/`, {
        method, headers: { 'X-CSRF-Token': csrfToken, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (generation !== authGeneration) return;
      if (method === 'DELETE') {
        records.delete(id); drafts.delete(id); card.remove();
        feedback(workspaceStatus, `Comment #${id} was deleted.`);
      } else if (result?.comment) {
        const updated = result.comment;
        if (body && 'reply' in body) drafts.delete(id);
        if (statusFilter.value !== 'all' && updated.status !== statusFilter.value) {
          records.delete(id); card.remove();
        } else { records.set(id, updated); card.replaceWith(commentCard(updated)); }
        feedback(workspaceStatus, body?.status ? `Comment #${id} is now ${updated.status}.` : `Reply for comment #${id} ${body?.reply === null ? 'removed' : 'saved'}.`);
      } else throw new Error('Update could not be confirmed');
      updateListSummary();
    } catch (error) {
      if (generation !== authGeneration || expired(error)) return;
      feedback(message, errorMessage(error, true), true);
    } finally {
      if (generation === authGeneration) {
        mutations.delete(id); controls.forEach((control, index) => { control.disabled = previousDisabled[index]; });
        card.removeAttribute('aria-busy'); syncControls();
      }
    }
  }

  statusFilter.addEventListener('change', () => void loadComments());
  gameFilter.addEventListener('change', () => void loadComments());
  refreshButton.addEventListener('click', () => void loadComments());
  listRetry.addEventListener('click', () => void loadComments(retryAppend));
  more.addEventListener('click', () => void loadComments(true));
  sessionRetry.addEventListener('click', () => void checkSession());
  window.addEventListener('pagehide', () => { clearPrivateState(); loginPanel.hidden = true; startPanel.hidden = false; });
  // A restored page may retain an unfinished auth request; start a fresh session check.
  window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
  window.addEventListener('focus', () => { if (session) void checkSession(); });
  syncControls();
  void checkSession();
}
