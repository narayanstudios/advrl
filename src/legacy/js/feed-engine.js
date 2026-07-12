/**
 * ============================================================================
 * FEED-ENGINE.JS — refactored from the original assets/js/feed.js
 * ============================================================================
 * WHY THIS FILE IS DIFFERENT FROM THE ORIGINAL feed.js:
 *
 * The original feed.js was a page-lifetime IIFE: one module-level `state`
 * object, one `.feed` container, one toast, one image viewer, booted once on
 * DOMContentLoaded. That's fine for a static page, but it can't be reused for
 * a second, independent post list — and the migration brief requires the
 * Profile page to reuse the exact same PostCard used on Home.
 *
 * So the ONLY structural change made here is: module-level `state` was turned
 * into a per-call closure (`createHomeFeedController`), and the click/tap
 * interaction wiring was pulled out into a standalone `attachCardInteractions`
 * function so Profile can wire up like/save/share/menu/viewer behavior on its
 * own post container without pulling in Home's pagination/tabs/pull-to-refresh
 * logic.
 *
 * Every function body below (buildPostCard, normalizePost, the image viewer,
 * like/save/share handlers, infinite scroll, pull-to-refresh, widget
 * hydration) is copied unchanged from the original file. Only asset paths
 * were updated (icons now live under /legacy/icons/ as static public files
 * instead of relative ../../assets/icons/ paths, since the folder moved).
 * ============================================================================
 */

const PAGE_SIZE = 6;
const CACHE_PREFIX = 'advora_feed_cache_v2_';

const ASSETS = {
  profileFallback: '/legacy/icons/profile-fallback.svg',
  verificationBadge: '/legacy/icons/verification-badge.svg',
  brokenImageFallback: '/legacy/icons/broken-img-fallback.svg',
};

function getApi() {
  const api = window.AdvoraAPI;
  if (!api) console.error('[feed-engine] AdvoraAPI not found. Load data.js first.');
  return api;
}

// ── Pure helpers (unchanged from feed.js) ─────────────────────────────────
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function safeText(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

export function initialsFromName(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function timeAgo(isoString) {
  if (!isoString) return '';
  const t = new Date(isoString).getTime();
  if (Number.isNaN(t)) return '';
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

export function formatCount(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return '0';
  if (num < 1000) return String(Math.floor(num));
  if (num < 1_000_000) return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  return `${(num / 1_000_000_000).toFixed(num >= 10_000_000_000 ? 0 : 1).replace(/\.0$/, '')}B`;
}

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizePost(post) {
  return {
    id: String(post?.id ?? post?.postId ?? ''),
    author: post?.author ? String(post.author) : 'Unknown author',
    fullName: post?.fullName ? String(post.fullName) : '',
    caption: post?.caption ? String(post.caption) : '',
    text: post?.text ? String(post.text) : '',
    image: (post?.imageUrl || post?.image) ? String(post.imageUrl || post.image) : '',
    createdAt: (post?.timestamp || post?.createdAt) ? String(post.timestamp || post.createdAt) : '',
    likes: toNumber(post?.likes, 0),
    comments: toNumber(post?.comments, 0),
    shares: toNumber(post?.shares, 0),
    liked: !!post?.liked,
    saved: !!post?.saved,
    avatarColor: post?.avatarColor ? String(post.avatarColor) : '',
    photoURL: post?.photoURL ? String(post.photoURL) : '',
    adminVerified: !!post?.adminVerified,
  };
}

export function normalizePosts(posts) {
  return Array.isArray(posts) ? posts.map(normalizePost) : [];
}

export function safeImageUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(String(url), window.location.href);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
    return '';
  } catch {
    return '';
  }
}

export function upgradeDriveImageQuality(url) {
  if (!url) return url;
  try {
    const u = new URL(url, window.location.href);
    if (u.hostname === 'drive.google.com' && u.pathname === '/thumbnail') {
      u.searchParams.set('sz', 'w1000');
      return u.href;
    }
    return url;
  } catch {
    return url;
  }
}

function setCount(el, count) {
  if (!el) return;
  const value = Math.max(0, toNumber(count, 0));
  el.dataset.raw = String(value);
  el.textContent = formatCount(value);
}

function getCount(el) {
  if (!el) return 0;
  const raw = el.dataset.raw;
  if (raw !== undefined) return Math.max(0, toNumber(raw, 0));
  const txt = (el.textContent || '').trim();
  const m = txt.match(/^([\d.]+)\s*([kKmMbB]?)$/);
  if (!m) return 0;
  const num = parseFloat(m[1]);
  const suffix = m[2].toLowerCase();
  if (!Number.isFinite(num)) return 0;
  if (suffix === 'k') return Math.round(num * 1000);
  if (suffix === 'm') return Math.round(num * 1_000_000);
  if (suffix === 'b') return Math.round(num * 1_000_000_000);
  return Math.round(num);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ── Toast (shared singleton across whichever page is mounted) ────────────
const toastState = { queue: [], visible: false, timer: null };

export function queueToast(message) {
  toastState.queue.push(String(message || ''));
  processToastQueue();
}

function processToastQueue() {
  if (toastState.visible || !toastState.queue.length) return;

  let toast = document.getElementById('advora-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'advora-toast';
    toast.className = 'advora-toast';
    document.body.appendChild(toast);
  }

  const message = toastState.queue.shift();
  toast.textContent = message;
  toast.classList.add('show');
  toastState.visible = true;

  clearTimeout(toastState.timer);
  toastState.timer = setTimeout(() => {
    toast.classList.remove('show');
    toastState.visible = false;
    processToastQueue();
  }, 2200);
}

function closeAllMenus(except) {
  document.querySelectorAll('.post-menu.open').forEach((menu) => {
    if (menu !== except) menu.classList.remove('open');
  });
}

// ── PostCard builder — THE shared component used by Home and Profile ─────
export function buildPostCard(postInput) {
  const post = normalizePost(postInput);
  const article = document.createElement('article');
  article.className = 'card post-card';
  article.dataset.postId = post.id;

  const imageUrl = safeImageUrl(upgradeDriveImageQuality(post.image));

  const captionHtml = post.caption ? `<div class="post-caption" style="font-weight: 600; font-size: 1.05em; margin-bottom: 4px;">${safeText(post.caption)}</div>` : '';
  const textHtml = post.text ? `<div class="post-text" style="color: var(--text-secondary, #555);">${safeText(post.text)}</div>` : '';

  const displayName = post.author && post.author !== 'Unknown author'
    ? post.author
    : (post.fullName || post.author);

  const safePhoto = safeImageUrl(upgradeDriveImageQuality(post.photoURL));
  const avatarInnerHtml = safePhoto
    ? `<img src="${escapeHtml(safePhoto)}" alt="" class="post-avatar-img" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${ASSETS.profileFallback}';this.classList.add('is-fallback');">`
    : `<img src="${ASSETS.profileFallback}" alt="" class="post-avatar-img is-fallback" loading="lazy" decoding="async">`;

  const verifiedBadgeHtml = post.adminVerified
    ? `<img src="${ASSETS.verificationBadge}" alt="Verified" class="verified-badge" title="Verified">`
    : '';

  article.innerHTML = `
    <div class="ch">
      <div class="post-avatar" style="background:transparent;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:50%;">${avatarInnerHtml}</div>
      <div class="hm">
        <div class="post-name">${escapeHtml(displayName)}${verifiedBadgeHtml}</div>
        <div class="post-meta">${escapeHtml(timeAgo(post.createdAt))}</div>
      </div>
      <div class="post-menu">
        <button class="post-menu-btn" data-action="menu" aria-label="More options" style="background:transparent;border:none;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
        <div class="post-menu-dropdown">
          <button class="post-menu-item" data-action="copy">Copy Full Post Text</button>
          <button class="post-menu-item danger" data-action="report">Report Post</button>
        </div>
      </div>
    </div>
    ${imageUrl ? `
      <div class="post-image-wrap" data-post-id="${escapeHtml(post.id)}">
        <img class="post-image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.src='${ASSETS.brokenImageFallback}';this.classList.add('is-broken-fallback');this.closest('.post-image-wrap').classList.add('broken');">
        <div class="like-heart-burst" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 21s-7.5-4.8-10-9.5C0.3 8 1.7 4.5 5 3.6 7.4 3 9.7 4 12 6.5 14.3 4 16.6 3 19 3.6c3.3.9 4.7 4.4 3 7.9C19.5 16.2 12 21 12 21z"/></svg>
        </div>
      </div>` : ''
    }
    ${(captionHtml || textHtml) ? `<div class="post-content" style="margin-top:12px;">${captionHtml}${textHtml}</div>` : ''}
    <div class="post-actions">
      <button class="action-btn like-btn ${post.liked ? 'active' : ''}" data-action="like" aria-pressed="${post.liked ? 'true' : 'false'}">
        <span class="ripple"></span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        <span class="action-count like-count" data-raw="${post.likes}">${formatCount(post.likes)}</span>
      </button>
      <button class="action-btn" data-action="comment">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span class="action-count">${formatCount(post.comments)}</span>
      </button>
      <button class="action-btn" data-action="share">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>
      </button>
      <button class="action-btn save-btn ${post.saved ? 'active' : ''}" data-action="save" aria-pressed="${post.saved ? 'true' : 'false'}" style="margin-left:auto;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="${post.saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
    </div>
  `;

  return article;
}

export function renderEmptyState() {
  const div = document.createElement('div');
  div.className = 'feed-state-block';
  div.innerHTML = `<div class="feed-state-icon">🗒️</div><div class="feed-state-title">No posts yet</div><div class="feed-state-sub">Check back soon.</div>`;
  return div;
}

export function renderErrorState(message, onRetry) {
  const div = document.createElement('div');
  div.className = 'feed-state-block';
  div.innerHTML = `<div class="feed-state-icon">⚠️</div><div class="feed-state-title">Couldn't load feed</div><div class="feed-state-sub">${escapeHtml(message || 'Something went wrong')}</div><button class="qbtn feed-retry-btn" style="background:var(--tp);color:#fff;">Retry</button>`;
  div.querySelector('.feed-retry-btn').addEventListener('click', onRetry);
  return div;
}

// ── Image viewer (module-level singleton, same as original) ──────────────
const viewer = {
  el: null, img: null, stage: null, open: false,
  scale: 1, tx: 0, ty: 0, dragging: false, lastX: 0, lastY: 0,
  pinchStartDist: 0, pinchStartScale: 1, pinchMidX: 0, pinchMidY: 0, raf: 0,
};

function clampViewerTransform() {
  if (!viewer.stage) return;
  const rect = viewer.stage.getBoundingClientRect();
  const maxX = Math.max(0, ((rect.width * (viewer.scale - 1)) / 2));
  const maxY = Math.max(0, ((rect.height * (viewer.scale - 1)) / 2));
  viewer.tx = clamp(viewer.tx, -maxX, maxX);
  viewer.ty = clamp(viewer.ty, -maxY, maxY);
  if (viewer.scale <= 1.01) {
    viewer.scale = 1;
    viewer.tx = 0;
    viewer.ty = 0;
  }
}

function renderViewerTransform(smooth = false) {
  if (!viewer.img) return;
  if (viewer.raf) cancelAnimationFrame(viewer.raf);
  viewer.raf = requestAnimationFrame(() => {
    clampViewerTransform();
    viewer.img.style.transition = smooth ? 'transform 0.18s ease' : 'none';
    viewer.img.style.transform = `translate(${viewer.tx}px, ${viewer.ty}px) scale(${viewer.scale})`;
  });
}

function zoomAt(clientX, clientY, deltaScale) {
  if (!viewer.stage || !viewer.img) return;
  const rect = viewer.stage.getBoundingClientRect();
  const oldScale = viewer.scale;
  const nextScale = clamp(oldScale + deltaScale, 1, 4);
  if (nextScale === oldScale) return;

  const cx = clientX - rect.left;
  const cy = clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const dx = cx - centerX - viewer.tx;
  const dy = cy - centerY - viewer.ty;
  const scaleRatio = nextScale / oldScale;

  viewer.tx = viewer.tx - dx * (scaleRatio - 1);
  viewer.ty = viewer.ty - dy * (scaleRatio - 1);
  viewer.scale = nextScale;

  if (nextScale === 1) {
    viewer.tx = 0;
    viewer.ty = 0;
  }
  renderViewerTransform(true);
}

function buildViewer() {
  if (viewer.el) return;

  const overlay = document.createElement('div');
  overlay.className = 'image-viewer-overlay';
  overlay.innerHTML = `
    <button class="image-viewer-close" aria-label="Close image">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="image-viewer-stage">
      <img class="image-viewer-img" alt="" draggable="false" />
    </div>
  `;
  document.body.appendChild(overlay);

  viewer.el = overlay;
  viewer.stage = overlay.querySelector('.image-viewer-stage');
  viewer.img = overlay.querySelector('.image-viewer-img');

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeViewer();
  });
  overlay.querySelector('.image-viewer-close').addEventListener('click', closeViewer);

  overlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.12 : 0.12;
    zoomAt(e.clientX, e.clientY, delta);
  }, { passive: false });

  viewer.img.addEventListener('mousedown', (e) => {
    e.preventDefault();
    viewer.dragging = true;
    viewer.lastX = e.clientX;
    viewer.lastY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!viewer.dragging) return;
    viewer.tx += e.clientX - viewer.lastX;
    viewer.ty += e.clientY - viewer.lastY;
    viewer.lastX = e.clientX;
    viewer.lastY = e.clientY;
    renderViewerTransform();
  });

  window.addEventListener('mouseup', () => {
    viewer.dragging = false;
  });

  let lastTapTime = 0;
  let touchMode = null;

  viewer.img.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      touchMode = 'pinch';
      viewer.pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      viewer.pinchStartScale = viewer.scale;
      viewer.pinchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      viewer.pinchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      return;
    }
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime < 300) {
        if (viewer.scale > 1.05) {
          viewer.scale = 1;
          viewer.tx = 0;
          viewer.ty = 0;
        } else {
          viewer.scale = 2.2;
        }
        renderViewerTransform(true);
        lastTapTime = 0;
        touchMode = null;
        return;
      }
      lastTapTime = now;
      touchMode = 'pan';
      viewer.lastX = e.touches[0].clientX;
      viewer.lastY = e.touches[0].clientY;
    }
  }, { passive: true });

  viewer.img.addEventListener('touchmove', (e) => {
    if (touchMode === 'pinch' && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / (viewer.pinchStartDist || dist);
      viewer.scale = clamp(viewer.pinchStartScale * ratio, 1, 4);

      const rect = viewer.stage.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const px = viewer.pinchMidX - rect.left;
      const py = viewer.pinchMidY - rect.top;
      const dx = px - centerX - viewer.tx;
      const dy = py - centerY - viewer.ty;
      const scaleRatio = viewer.scale / viewer.pinchStartScale;
      viewer.tx = viewer.tx - dx * (scaleRatio - 1);
      viewer.ty = viewer.ty - dy * (scaleRatio - 1);

      renderViewerTransform();
    } else if (touchMode === 'pan' && e.touches.length === 1 && viewer.scale > 1) {
      viewer.tx += e.touches[0].clientX - viewer.lastX;
      viewer.ty += e.touches[0].clientY - viewer.lastY;
      viewer.lastX = e.touches[0].clientX;
      viewer.lastY = e.touches[0].clientY;
      renderViewerTransform();
    }
  }, { passive: true });

  viewer.img.addEventListener('touchend', () => {
    touchMode = null;
  });
}

export function openViewer(src) {
  if (!src || src.endsWith(ASSETS.brokenImageFallback)) return;
  const safeSrc = safeImageUrl(src);
  if (!safeSrc) return;
  buildViewer();
  viewer.img.src = safeSrc;
  viewer.scale = 1;
  viewer.tx = 0;
  viewer.ty = 0;
  renderViewerTransform();
  viewer.el.classList.add('open');
  document.body.classList.add('viewer-lock-scroll');
  viewer.open = true;
}

export function closeViewer() {
  if (!viewer.el) return;
  viewer.el.classList.remove('open');
  document.body.classList.remove('viewer-lock-scroll');
  viewer.open = false;
}

function spawnParticles(btn) {
  const colors = ['#EF4444', '#F97316', '#EC4899'];
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('span');
    p.className = 'like-particle';
    const angle = (i / 6) * Math.PI * 2;
    p.style.setProperty('--dx', `${Math.cos(angle) * 18}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * 18}px`);
    p.style.background = colors[i % colors.length];
    btn.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

// ── Card-level actions — shared by Home feed and Profile posts ───────────
async function handleLike(card) {
  const api = getApi();
  const postId = card.dataset.postId;
  const btn = card.querySelector('.like-btn');
  const countEl = btn?.querySelector('.like-count');
  const svg = btn?.querySelector('svg');
  if (!btn || !countEl || !svg) return;

  const prevActive = btn.classList.contains('active');
  const prevCount = getCount(countEl);

  btn.classList.toggle('active', !prevActive);
  btn.setAttribute('aria-pressed', String(!prevActive));
  svg.setAttribute('fill', prevActive ? 'none' : 'currentColor');
  setCount(countEl, prevCount + (prevActive ? -1 : 1));
  btn.classList.add('bounce');
  spawnParticles(btn);
  setTimeout(() => btn.classList.remove('bounce'), 350);

  try {
    const res = await api.toggleLike(postId);
    if (res.error) throw new Error('like failed');
    if (res.data && res.data.liked !== undefined) {
      btn.classList.toggle('active', !!res.data.liked);
      btn.setAttribute('aria-pressed', String(!!res.data.liked));
      svg.setAttribute('fill', res.data.liked ? 'currentColor' : 'none');
      setCount(countEl, res.data.likes);
    }
  } catch {
    btn.classList.toggle('active', prevActive);
    btn.setAttribute('aria-pressed', String(prevActive));
    svg.setAttribute('fill', prevActive ? 'currentColor' : 'none');
    setCount(countEl, prevCount);
  }
}

async function handleDoubleTapLike(imgWrap, card) {
  if (!imgWrap || !card) return;
  const btn = card.querySelector('.like-btn');
  if (btn && !btn.classList.contains('active')) {
    await handleLike(card);
  }
  const burst = imgWrap.querySelector('.like-heart-burst');
  if (!burst) return;
  burst.classList.remove('animate');
  void burst.offsetWidth;
  burst.classList.add('animate');
}

async function handleSave(card) {
  const api = getApi();
  const postId = card.dataset.postId;
  const btn = card.querySelector('.save-btn');
  const svg = btn?.querySelector('svg');
  if (!btn || !svg) return;

  const prevActive = btn.classList.contains('active');
  btn.classList.toggle('active', !prevActive);
  btn.setAttribute('aria-pressed', String(!prevActive));
  svg.setAttribute('fill', prevActive ? 'none' : 'currentColor');

  try {
    const res = await api.toggleSave(postId);
    if (res.error || !res.data) throw new Error('save failed');
    btn.classList.toggle('active', !!res.data.saved);
    btn.setAttribute('aria-pressed', String(!!res.data.saved));
    svg.setAttribute('fill', res.data.saved ? 'currentColor' : 'none');
    queueToast(res.data.saved ? 'Saved to your library' : 'Removed from library');
  } catch {
    btn.classList.toggle('active', prevActive);
    btn.setAttribute('aria-pressed', String(prevActive));
    svg.setAttribute('fill', prevActive ? 'currentColor' : 'none');
  }
}

async function handleShare(card) {
  const api = getApi();
  const postId = card.dataset.postId;
  const countEl = card.querySelector('[data-action="share"] .action-count');

  try {
    const res = await api.sharePost(postId);
    if (res.error || !res.data) throw new Error('share failed');
    if (countEl) setCount(countEl, res.data.shares);
    if (navigator.clipboard?.writeText && res.data.shareUrl) {
      await navigator.clipboard.writeText(String(res.data.shareUrl));
    }
    queueToast('Link copied to clipboard');
  } catch {
    queueToast('Could not share this post right now');
  }
}

async function handleCopyText(postId) {
  const api = getApi();
  try {
    const res = await api.copyPost(postId);
    if (res.error || !res.data) throw new Error('copy failed');
    const text = res.data.text || '(No caption)';
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(String(text));
    }
    queueToast('Post text copied');
  } catch {
    queueToast('Could not copy this post');
  }
}

async function handleReport(postId) {
  const api = getApi();
  try {
    const res = await api.reportPost(postId, 'user_reported');
    if (res.error || !res.data) throw new Error('report failed');
    queueToast('Post reported');
  } catch {
    queueToast('Could not submit report');
  }
}

const tapState = new WeakMap();

async function handleTapOnImageWrap(wrap, card, e) {
  if (!wrap || wrap.classList.contains('broken')) return;
  if (e.target.closest('.image-viewer-overlay')) return;

  const now = Date.now();
  const current = tapState.get(wrap) || { lastTap: 0, timer: null };
  const delta = now - current.lastTap;

  if (delta < 280) {
    if (current.timer) clearTimeout(current.timer);
    tapState.set(wrap, { lastTap: 0, timer: null });
    await handleDoubleTapLike(wrap, card);
    return;
  }

  const timer = setTimeout(() => {
    openViewer(wrap.querySelector('.post-image')?.src || '');
    const latest = tapState.get(wrap);
    if (latest) tapState.set(wrap, { lastTap: 0, timer: null });
  }, 280);

  tapState.set(wrap, { lastTap: now, timer });
}

/**
 * Wires up click/tap interactions (menu, copy, report, like, save, share,
 * comment, image tap/double-tap-to-like) for any post-card container.
 * This is the piece both Home's feed and Profile's post list call, so the
 * "one shared PostCard" behaves identically everywhere it's used.
 * Returns a cleanup function to remove listeners on unmount.
 */
export function attachCardInteractions(containerEl) {
  function onClick(e) {
    const card = e.target.closest('.post-card');
    if (!card) {
      closeAllMenus();
      return;
    }
    const postId = card.dataset.postId;
    const menuBtn = e.target.closest('[data-action="menu"]');
    if (menuBtn) {
      const menu = menuBtn.closest('.post-menu');
      const isOpen = menu.classList.contains('open');
      closeAllMenus();
      menu.classList.toggle('open', !isOpen);
      return;
    }
    if (e.target.closest('[data-action="copy"]')) return handleCopyText(postId);
    if (e.target.closest('[data-action="report"]')) return handleReport(postId);
    if (e.target.closest('[data-action="like"]')) return handleLike(card);
    if (e.target.closest('[data-action="save"]')) return handleSave(card);
    if (e.target.closest('[data-action="share"]')) return handleShare(card);
    if (e.target.closest('[data-action="comment"]')) return queueToast('Comments coming soon');

    if (!('ontouchstart' in window)) {
      const wrap = e.target.closest('.post-image-wrap');
      if (wrap && !wrap.classList.contains('broken')) {
        openViewer(wrap.querySelector('.post-image')?.src || '');
      }
    }
  }

  let touchScrollMoved = false;
  function onTouchStart() { touchScrollMoved = false; }
  function onTouchMove() { touchScrollMoved = true; }
  async function onTouchEnd(e) {
    if (touchScrollMoved) return;
    const wrap = e.target.closest('.post-image-wrap');
    if (!wrap || wrap.classList.contains('broken')) return;
    const card = wrap.closest('.post-card');
    if (!card) return;
    await handleTapOnImageWrap(wrap, card, e);
  }
  function onDocClick(e) {
    if (!e.target.closest('.post-menu')) closeAllMenus();
  }
  function onKeydown(e) {
    if (e.key === 'Escape') closeViewer();
  }

  containerEl.addEventListener('click', onClick);
  containerEl.addEventListener('touchstart', onTouchStart, { passive: true });
  containerEl.addEventListener('touchmove', onTouchMove, { passive: true });
  containerEl.addEventListener('touchend', onTouchEnd);
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKeydown);

  return function destroy() {
    containerEl.removeEventListener('click', onClick);
    containerEl.removeEventListener('touchstart', onTouchStart);
    containerEl.removeEventListener('touchmove', onTouchMove);
    containerEl.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onKeydown);
  };
}

// ── Home feed controller: pagination, tabs, pull-to-refresh, widgets ─────
// (This part is Home-specific and is NOT reused by Profile.)
export function createHomeFeedController(feedEl, fhEl) {
  const state = {
    feedEl, fhEl,
    cursor: null,
    hasMore: true,
    isLoadingMore: false,
    loadToken: 0,
    sentinelObserver: null,
  };
  const currentTabState = { value: 'All' };

  function getCacheKey() {
    return `${CACHE_PREFIX}${currentTabState.value}`;
  }

  function readCache() {
    try {
      const raw = sessionStorage.getItem(getCacheKey());
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function writeCache(posts, lastVisibleId, more) {
    try {
      const safePosts = normalizePosts(posts).map((p) => ({
        id: p.id, author: p.author, fullName: p.fullName, text: p.text,
        image: p.image, createdAt: p.createdAt, likes: p.likes,
        comments: p.comments, shares: p.shares, liked: p.liked, saved: p.saved,
        avatarColor: p.avatarColor, photoURL: p.photoURL, adminVerified: p.adminVerified,
      }));
      sessionStorage.setItem(getCacheKey(), JSON.stringify({
        posts: safePosts, cursor: lastVisibleId || null, hasMore: !!more,
        tab: currentTabState.value, ts: Date.now(),
      }));
    } catch {}
  }

  function clearFeedContent() {
    state.feedEl.querySelectorAll('.card, .post-card, .feed-state-block, .ptr-indicator, .feed-sentinel').forEach((el) => el.remove());
  }

  function ensureSentinel() {
    let sentinel = state.feedEl.querySelector('.feed-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.className = 'feed-sentinel';
      sentinel.innerHTML = `<div class="feed-spinner" aria-hidden="true"></div>`;
      state.feedEl.appendChild(sentinel);
    }
    sentinel.classList.remove('visible');
    return sentinel;
  }

  function setupInfiniteScroll() {
    const sentinel = ensureSentinel();
    if (state.sentinelObserver) state.sentinelObserver.disconnect();
    state.sentinelObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && state.hasMore && !state.isLoadingMore) loadMore();
      }
    }, { root: state.feedEl, threshold: 0.12 });
    state.sentinelObserver.observe(sentinel);
  }

  async function fetchFeedPage(mode, cursor) {
    const api = getApi();
    if (mode === 'refresh') return api.refreshFeed({ limit: PAGE_SIZE });
    if (mode === 'more') return api.fetchNextPage({ cursor, limit: PAGE_SIZE });
    return api.getPosts({ limit: PAGE_SIZE, cursor: null, tab: currentTabState.value });
  }

  async function freshLoad() {
    const token = ++state.loadToken;
    clearFeedContent();
    state.isLoadingMore = false;
    state.cursor = null;
    state.hasMore = true;

    try {
      const res = await fetchFeedPage('initial', null);
      if (token !== state.loadToken) return;
      if (res.error || !res.data?.success) throw new Error(res.data?.error || 'Failed to load');

      const posts = normalizePosts(res.data.posts);
      const lastVisibleId = res.data.lastVisibleId ?? null;
      const more = !!res.data.hasMore;

      clearFeedContent();
      if (!posts.length) {
        state.feedEl.appendChild(renderEmptyState());
        state.cursor = null;
        state.hasMore = false;
        return;
      }
      posts.forEach((p) => state.feedEl.appendChild(buildPostCard(p)));
      state.cursor = lastVisibleId;
      state.hasMore = more;
      writeCache(posts, lastVisibleId, more);
      setupInfiniteScroll();
    } catch (err) {
      if (token !== state.loadToken) return;
      state.feedEl.appendChild(renderErrorState(err?.message || 'Unable to load feed', freshLoad));
    }
  }

  async function silentRevalidate() {
    const token = ++state.loadToken;
    try {
      const res = await fetchFeedPage('refresh', null);
      if (token !== state.loadToken) return;
      if (res.error || !res.data?.success) return;

      const posts = normalizePosts(res.data.posts);
      const lastVisibleId = res.data.lastVisibleId ?? null;
      const more = !!res.data.hasMore;

      state.feedEl.querySelectorAll('.post-card').forEach((el) => el.remove());
      const sentinel = ensureSentinel();
      posts.forEach((p) => state.feedEl.insertBefore(buildPostCard(p), sentinel));
      state.cursor = lastVisibleId;
      state.hasMore = more;
      writeCache(posts, lastVisibleId, more);
      setupInfiniteScroll();
    } catch {}
  }

  async function initialLoad() {
    const cached = readCache();
    if (cached && Array.isArray(cached.posts) && cached.posts.length) {
      clearFeedContent();
      normalizePosts(cached.posts).forEach((p) => state.feedEl.appendChild(buildPostCard(p)));
      state.cursor = cached.cursor ?? null;
      state.hasMore = !!cached.hasMore;
      setupInfiniteScroll();
      silentRevalidate();
      return;
    }
    await freshLoad();
  }

  async function loadMore() {
    if (state.isLoadingMore || !state.hasMore) return;
    state.isLoadingMore = true;
    const token = ++state.loadToken;
    const sentinel = ensureSentinel();
    sentinel.classList.add('visible');

    try {
      const res = await fetchFeedPage('more', state.cursor);
      if (token !== state.loadToken) return;
      if (res.error || !res.data?.success) throw new Error();

      const posts = normalizePosts(res.data.posts);
      const lastVisibleId = res.data.lastVisibleId ?? state.cursor;
      const more = !!res.data.hasMore && posts.length > 0;

      posts.forEach((p) => state.feedEl.insertBefore(buildPostCard(p), sentinel));
      state.cursor = lastVisibleId;
      state.hasMore = more;
      if (!more) sentinel.remove();
    } catch {
      queueToast('Could not load more posts.');
    } finally {
      state.isLoadingMore = false;
      const s = state.feedEl.querySelector('.feed-sentinel');
      if (s) s.classList.remove('visible');
    }
  }

  function wireTabs() {
    if (!state.fhEl) return () => {};
    const tabs = Array.from(state.fhEl.querySelectorAll('.tab'));
    const handlers = tabs.map((tab) => {
      const handler = async () => {
        const nextTab = tab.textContent.trim();
        if (nextTab === currentTabState.value) return;
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        currentTabState.value = nextTab;
        state.cursor = null;
        state.hasMore = true;
        state.isLoadingMore = false;
        if (state.sentinelObserver) state.sentinelObserver.disconnect();
        clearFeedContent();
        await freshLoad();
      };
      tab.addEventListener('click', handler);
      return { tab, handler };
    });
    return () => handlers.forEach(({ tab, handler }) => tab.removeEventListener('click', handler));
  }

  function setupPullToRefresh() {
    let startX = 0, startY = 0, dragging = false;
    const THRESHOLD = 110;
    let indicator = null;

    function ensureIndicator() {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'ptr-indicator';
        indicator.innerHTML = `<div class="feed-spinner"></div>`;
        state.feedEl.insertBefore(indicator, state.feedEl.firstChild);
      }
      return indicator;
    }

    function onStart(e) {
      if (state.feedEl.scrollTop <= 10) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dragging = true;
      } else {
        dragging = false;
      }
    }
    function onMove(e) {
      if (!dragging) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dy) < Math.abs(dx)) return;
      if (dy > 0 && state.feedEl.scrollTop <= 10) {
        const ind = ensureIndicator();
        ind.classList.add('active');
        ind.style.opacity = String(clamp(dy / THRESHOLD, 0, 1));
      }
    }
    async function onEnd(e) {
      if (!dragging) return;
      dragging = false;
      const endX = e.changedTouches?.[0]?.clientX ?? startX;
      const endY = e.changedTouches?.[0]?.clientY ?? startY;
      const dx = endX - startX;
      const dy = endY - startY;
      if (!indicator) return;
      if (Math.abs(dy) > Math.abs(dx) && dy > THRESHOLD) {
        indicator.classList.add('spinning');
        try {
          await silentRevalidate();
        } finally {
          indicator.classList.remove('spinning', 'active');
          indicator.style.opacity = '0';
        }
      } else {
        indicator.classList.remove('active');
        indicator.style.opacity = '0';
      }
    }

    state.feedEl.addEventListener('touchstart', onStart, { passive: true });
    state.feedEl.addEventListener('touchmove', onMove, { passive: true });
    state.feedEl.addEventListener('touchend', onEnd);

    return () => {
      state.feedEl.removeEventListener('touchstart', onStart);
      state.feedEl.removeEventListener('touchmove', onMove);
      state.feedEl.removeEventListener('touchend', onEnd);
    };
  }

  async function hydrateTodo() {
    const api = getApi();
    const widget = document.getElementById('todoWidget');
    if (!widget) return;
    try {
      const res = await api.getTodo();
      if (res.error || !res.data?.todos) return;
      widget.querySelectorAll('.todo-item').forEach((el) => el.remove());
      const wh = widget.querySelector('.wh');
      const frag = document.createDocumentFragment();
      res.data.todos.forEach((t) => {
        const label = document.createElement('label');
        label.className = 'todo-item';
        label.dataset.todoId = t.id;
        label.innerHTML = `
          <div class="todo-left">
            <div class="custom-checkbox"><input type="checkbox" ${t.done ? 'checked' : ''}><span class="checkmark"></span></div>
            <span class="todo-text">${escapeHtml(t.text)}</span>
          </div>
          <span class="badge ${escapeHtml(t.tag || '')}">${escapeHtml(t.topic || '')}</span>
        `;
        label.querySelector('input').addEventListener('change', async () => {
          const r = await api.toggleTodo(t.id);
          if (r.error) queueToast('Could not update task');
        });
        frag.appendChild(label);
      });
      if (wh && wh.nextSibling) widget.insertBefore(frag, wh.nextSibling);
      else widget.appendChild(frag);
    } catch {}
  }

  async function hydrateSchedule() {
    const api = getApi();
    const widget = document.getElementById('schedWidget');
    if (!widget) return;
    try {
      const res = await api.getSchedule();
      if (res.error || !res.data?.schedule) return;
      widget.querySelectorAll('.sched-item').forEach((el) => el.remove());
      res.data.schedule.forEach((s) => {
        const div = document.createElement('div');
        div.className = 'sched-item';
        div.innerHTML = `
          <span class="sched-time">${escapeHtml(s.time || '')}</span>
          <div class="sched-meta">
            <div class="sched-name">${escapeHtml(s.name || '')}</div>
            <div class="sched-sub">${escapeHtml(s.sub || '')}</div>
          </div>
        `;
        widget.appendChild(div);
      });
    } catch {}
  }

  async function hydrateNotifications() {
    const api = getApi();
    const widget = document.getElementById('notifWidget');
    if (!widget) return;
    widget.querySelectorAll('.notif-item').forEach((el) => el.remove());
    try {
      const res = await api.getNotifications();
      const badge = widget.querySelector('.wh span');
      if (res.error || !res.data?.notifications || res.data.notifications.length === 0) {
        if (badge) badge.style.display = 'none';
        if (!widget.querySelector('.empty-notif')) {
          widget.insertAdjacentHTML('beforeend', `
            <div class="empty-notif" style="padding: 20px; text-align: center; color: #888; font-size: 13px;">
              No new notifications
            </div>
          `);
        }
        return;
      }
      if (badge) {
        badge.style.display = 'inline-block';
        badge.textContent = `${res.data.notifications.length} new`;
      }
      res.data.notifications.forEach((n) => {
        const div = document.createElement('div');
        div.className = 'notif-item';
        div.innerHTML = `
          <div class="notif-dot ${n.read ? 'read' : ''}"></div>
          <div class="notif-body">
            <div class="notif-text">${safeText(n.text || '')}</div>
            <div class="notif-time">${escapeHtml(n.time || '')}</div>
          </div>
        `;
        widget.appendChild(div);
      });
    } catch {}
  }

  async function hydrateContinueReading() {
    const api = getApi();
    const widget = document.getElementById('crWidget');
    if (!widget) return;
    try {
      const res = await api.getContinueReading();
      if (res.error || !res.data?.items) return;
      widget.querySelectorAll('.read-item').forEach((el) => el.remove());
      res.data.items.forEach((c) => {
        const div = document.createElement('div');
        div.className = 'read-item';
        div.innerHTML = `
          <div class="read-thumb ${escapeHtml(c.thumbClass || '')}">${safeText(c.thumb || '')}</div>
          <div class="read-meta">
            <div class="read-title">${escapeHtml(c.title || '')}</div>
            <div class="read-author">${escapeHtml(c.author || '')}</div>
            <div class="read-bar-bg"><div class="read-bar-fill" style="width:${clamp(toNumber(c.progress, 0), 0, 100)}%"></div></div>
          </div>
        `;
        widget.appendChild(div);
      });
    } catch {}
  }

  const detachCardInteractions = attachCardInteractions(state.feedEl);
  const detachTabs = wireTabs();
  const detachPTR = setupPullToRefresh();

  initialLoad();
  hydrateTodo();
  hydrateSchedule();
  hydrateNotifications();
  hydrateContinueReading();

  function onOffline() { queueToast('Connection lost. You are offline.'); }
  function onOnline() { queueToast('Back online.'); }
  if (!navigator.onLine) queueToast('You appear to be offline. Showing cached content.');
  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);

  return {
    destroy() {
      state.loadToken++; // invalidate any in-flight loads
      if (state.sentinelObserver) state.sentinelObserver.disconnect();
      detachCardInteractions();
      detachTabs();
      detachPTR();
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    },
  };
}
