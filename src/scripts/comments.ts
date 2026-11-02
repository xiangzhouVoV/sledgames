export {};

interface PlayerComment {
  id: number;
  gameSlug: string;
  nickname: string;
  content: string;
  createdAt: string;
  reply: string | null;
  replyUpdatedAt: string | null;
}

interface TurnstileApi {
  ready(callback: () => void): void;
  render(container: HTMLElement, options: {
    sitekey: string;
    action: string;
    language: 'en';
    theme: 'light' | 'dark';
    size: 'normal' | 'compact';
    'response-field': boolean;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'timeout-callback': () => void;
    'error-callback': () => boolean;
  }): string | undefined;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

let turnstileLoading: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileLoading) return turnstileLoading;
  turnstileLoading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const fail = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error('Security check unavailable'));
    };
    const timeout = window.setTimeout(fail, 15000);
    script.addEventListener('error', fail, { once: true });
    script.addEventListener('load', () => {
      if (!window.turnstile) return fail();
      window.turnstile.ready(() => {
        clearTimeout(timeout);
        resolve(window.turnstile!);
      });
    }, { once: true });
    document.head.append(script);
  }).catch(error => {
    turnstileLoading = undefined;
    throw error;
  });
  return turnstileLoading;
}

const dateFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' });

function commentElement(comment: PlayerComment): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'comment-item';
  item.dataset.commentId = String(comment.id);
  const meta = document.createElement('div');
  meta.className = 'comment-meta';
  const name = document.createElement('strong');
  name.className = 'comment-name';
  name.textContent = comment.nickname;
  const date = document.createElement('time');
  date.dateTime = comment.createdAt;
  date.textContent = dateFormat.format(new Date(comment.createdAt));
  meta.append(name, date);
  const content = document.createElement('p');
  content.className = 'comment-text';
  content.textContent = comment.content;
  item.append(meta, content);
  if (comment.reply) {
    const reply = document.createElement('div');
    reply.className = 'comment-reply';
    const label = document.createElement('p');
    label.className = 'comment-reply-label';
    label.textContent = 'Sled Games reply';
    const text = document.createElement('p');
    text.className = 'comment-text';
    text.textContent = comment.reply;
    reply.append(label, text);
    item.append(reply);
  }
  return item;
}

function setupComments(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-comment-form]')!;
  const nickname = form.querySelector<HTMLInputElement>('[name="nickname"]')!;
  const content = form.querySelector<HTMLTextAreaElement>('[name="content"]')!;
  const website = form.querySelector<HTMLInputElement>('[name="website"]')!;
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const count = root.querySelector<HTMLElement>('[data-comment-count]')!;
  const status = root.querySelector<HTMLElement>('[data-comment-status]')!;
  const list = root.querySelector<HTMLUListElement>('[data-comments-list]')!;
  const listStatus = root.querySelector<HTMLElement>('[data-comments-status]')!;
  const more = root.querySelector<HTMLButtonElement>('[data-comments-more]')!;
  const retry = root.querySelector<HTMLButtonElement>('[data-comments-retry]')!;
  const challenge = root.querySelector<HTMLElement>('[data-comment-challenge]')!;
  const challengeStatus = root.querySelector<HTMLElement>('[data-challenge-status]')!;
  const challengeRetry = root.querySelector<HTMLButtonElement>('[data-challenge-retry]')!;
  const gameSlug = root.dataset.gameSlug!;
  const siteKey = root.dataset.turnstileSiteKey ?? '';
  const localBypass = !siteKey && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  let nextCursor: number | null = null;
  let listStarted = false;
  let loading = false;
  let submitting = false;
  let retryAfter = 0;
  let token = '';
  let widgetId: string | undefined;
  let challengeLoading = false;
  const shown = new Set<number>();

  function syncSubmit() {
    submit.disabled = submitting || Date.now() < retryAfter || (!localBypass && !token);
    submit.textContent = submitting ? 'Submitting…' : 'Submit comment';
  }

  function updateCount() {
    const length = [...content.value.trim()].length;
    count.textContent = `${length.toLocaleString('en')} / 2,000`;
    count.dataset.overLimit = String(length > 2000);
  }

  async function loadComments() {
    if (loading) return;
    loading = true;
    listStarted = true;
    list.setAttribute('aria-busy', 'true');
    listStatus.hidden = false;
    listStatus.textContent = 'Loading comments…';
    retry.hidden = true;
    more.disabled = true;
    const query = new URLSearchParams({ gameSlug, limit: '10' });
    if (nextCursor !== null) query.set('cursor', String(nextCursor));
    try {
      const response = await fetch(`/api/comments/?${query}`, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('Comments unavailable');
      const page: { comments: PlayerComment[]; nextCursor: number | null } = await response.json();
      if (!Array.isArray(page.comments) || (page.nextCursor !== null && (!Number.isSafeInteger(page.nextCursor) || page.nextCursor <= 0))) {
        throw new Error('Invalid comments response');
      }
      const fragment = document.createDocumentFragment();
      const pageIds = new Set<number>();
      for (const comment of page.comments) {
        if (comment.gameSlug !== gameSlug || shown.has(comment.id) || pageIds.has(comment.id)) continue;
        fragment.append(commentElement(comment));
        pageIds.add(comment.id);
      }
      list.append(fragment);
      for (const id of pageIds) shown.add(id);
      nextCursor = page.nextCursor;
      list.hidden = shown.size === 0;
      listStatus.textContent = shown.size ? '' : 'No comments yet. Be the first to share your thoughts.';
      more.hidden = nextCursor === null;
    } catch {
      listStatus.textContent = 'Comments could not be loaded. Please try again.';
      retry.hidden = false;
      more.hidden = true;
    } finally {
      list.removeAttribute('aria-busy');
      loading = false;
      more.disabled = false;
    }
  }

  async function startChallenge() {
    if (!siteKey || widgetId !== undefined || challengeLoading) return;
    challengeLoading = true;
    challengeRetry.hidden = true;
    challengeStatus.textContent = 'Loading security check…';
    try {
      const api = await loadTurnstile();
      widgetId = api.render(challenge, {
        sitekey: siteKey,
        action: 'comment',
        language: 'en',
        theme: document.body.classList.contains('christmas-page') ? 'dark' : 'light',
        size: challenge.clientWidth < 300 ? 'compact' : 'normal',
        'response-field': false,
        callback: value => {
          token = value;
          challengeStatus.textContent = '';
          challengeRetry.hidden = true;
          syncSubmit();
        },
        'expired-callback': () => {
          token = '';
          challengeStatus.textContent = 'Your security check expired. Please complete it again.';
          challengeRetry.hidden = false;
          syncSubmit();
        },
        'timeout-callback': () => {
          token = '';
          challengeStatus.textContent = 'Your security check timed out. Please try again.';
          challengeRetry.hidden = false;
          syncSubmit();
        },
        'error-callback': () => {
          token = '';
          challengeStatus.textContent = 'The security check could not be completed. Please try again.';
          challengeRetry.hidden = false;
          syncSubmit();
          return true;
        },
      });
      if (widgetId === undefined) throw new Error('Security check unavailable');
      if (!token) challengeStatus.textContent = 'Complete the security check to submit your comment.';
    } catch {
      challengeStatus.textContent = 'The security check could not be loaded. Please try again.';
      challengeRetry.hidden = false;
    } finally {
      challengeLoading = false;
    }
  }

  challengeRetry.addEventListener('click', () => {
    if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId);
    widgetId = undefined;
    token = '';
    syncSubmit();
    void startChallenge();
  });

  form.addEventListener('input', () => {
    nickname.setCustomValidity('');
    content.setCustomValidity('');
    updateCount();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || Date.now() < retryAfter) return;
    nickname.setCustomValidity('');
    content.setCustomValidity('');
    const name = nickname.value.trim();
    const text = content.value.trim();
    if (!name || [...name].length > 40 || /[\u0000-\u001f\u007f]/.test(name)) {
      nickname.setCustomValidity('Enter a nickname with 1–40 characters.');
    }
    if (!text || [...text].length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) {
      content.setCustomValidity('Enter a comment with 1–2,000 characters.');
    }
    if (!form.reportValidity()) return;
    if (!localBypass && !token) {
      void startChallenge();
      return;
    }
    submitting = true;
    syncSubmit();
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Submitting your comment…';
    nickname.readOnly = true;
    content.readOnly = true;
    try {
      const response = await fetch('/api/comments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSlug, nickname: name, content: text, website: website.value, ...(token ? { turnstileToken: token } : {}) }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (response.ok && result.status === 'pending') {
        content.value = '';
        website.value = '';
        updateCount();
        status.textContent = 'Thanks! Your comment is awaiting review.';
      } else if (response.status === 429) {
        const seconds = Number(response.headers.get('Retry-After'));
        const wait = Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 3600) : 60;
        retryAfter = Date.now() + wait * 1000;
        status.textContent = `You have submitted too many comments. Please try again in ${Math.ceil(wait / 60)} minute${wait > 60 ? 's' : ''}. Your draft is still here.`;
        window.setTimeout(syncSubmit, wait * 1000 + 50);
      } else if (response.status >= 500) {
        status.textContent = 'Comments are temporarily unavailable. Your draft is still here. Please try again later.';
      } else {
        status.textContent = typeof result.error?.message === 'string'
          ? `${result.error.message} Your draft is still here.`
          : 'Your comment could not be submitted. Your draft is still here. Please try again.';
      }
    } catch {
      status.textContent = 'We could not confirm your submission. It may have been received. Your draft is still here; please wait before trying again.';
    } finally {
      submitting = false;
      nickname.readOnly = false;
      content.readOnly = false;
      token = '';
      if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId);
      syncSubmit();
      form.removeAttribute('aria-busy');
      status.focus({ preventScroll: true });
    }
  });

  more.addEventListener('click', () => { void loadComments(); });
  retry.addEventListener('click', () => { void loadComments(); });
  function activate() {
    if (!listStarted) void loadComments();
    void startChallenge();
  }
  root.addEventListener('focusin', activate);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        activate();
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(root);
  } else activate();
  if (!siteKey && !localBypass) challengeStatus.textContent = 'Comments are temporarily unavailable. Please try again later.';
  form.hidden = false;
  syncSubmit();
}

document.querySelectorAll<HTMLElement>('[data-game-comments]').forEach(setupComments);
