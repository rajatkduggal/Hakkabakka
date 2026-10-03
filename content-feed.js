(function () {
  'use strict';

  const config = window.HAKKABAKKA_CONTENT_CONFIG || {};
  const profileUrl = config.instagramProfileUrl || 'https://www.instagram.com/hakka_bakka.in/';
  const fallbackItems = [
    { image: 'images/butter chicken.jpg', alt: 'Butter Chicken', label: 'From our kitchen', caption: 'A HakkaBakka favourite, prepared fresh for your table.' },
    { image: 'images/chilli mushroom.jpg', alt: 'Chilli Mushroom', label: 'From our kitchen', caption: 'A bold Indo-Chinese favourite from our menu.' },
    { image: 'images/dal makhani.jpg', alt: 'Dal Makhani', label: 'From our kitchen', caption: 'Slow-cooked Punjabi comfort food, made for sharing.' }
  ];

  const feed = document.getElementById('instagramUpdates');
  const status = document.getElementById('instagramStatus');
  const follow = document.querySelector('.ig-follow');
  if (!feed || !status) return;
  if (follow) follow.href = profileUrl;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function safePost(post) {
    return post && typeof post === 'object' && typeof post.image === 'string' && /^https:\/\//.test(post.image) && typeof post.permalink === 'string' && /^https:\/\/www\.instagram\.com\//.test(post.permalink);
  }

  function renderFallback(message) {
    feed.innerHTML = '<p class="ig-fallback-label">From our kitchen</p>' + fallbackItems.map(item => `
      <a class="ig-card" href="${profileUrl}" target="_blank" rel="noopener noreferrer" aria-label="Follow HakkaBakka on Instagram">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
        <div class="ig-card-body"><span class="ig-card-type">✦ ${escapeHtml(item.label)}</span><p class="ig-card-caption">${escapeHtml(item.caption)}</p></div>
      </a>`).join('');
    status.dataset.state = 'fallback';
    status.textContent = message;
    feed.setAttribute('aria-busy', 'false');
  }

  function renderPosts(posts) {
    feed.innerHTML = posts.slice(0, 6).map(post => {
      const type = String(post.mediaType || post.type || 'Post').toLowerCase() === 'reel' ? '▶ Reel' : '◎ Instagram';
      const caption = String(post.caption || '').trim().slice(0, 120) || 'See this update on Instagram.';
      const date = formatDate(post.timestamp || post.date);
      return `<a class="ig-card" href="${escapeHtml(post.permalink)}" target="_blank" rel="noopener noreferrer">
        <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.alt || 'HakkaBakka Instagram post')}" loading="lazy" decoding="async">
        <div class="ig-card-body"><span class="ig-card-type">${type}</span><p class="ig-card-caption">${escapeHtml(caption)}</p>${date ? `<p class="ig-card-date">${escapeHtml(date)}</p>` : ''}</div>
      </a>`;
    }).join('');
    status.dataset.state = 'live';
    status.textContent = 'Latest posts from @hakka_bakka.in.';
    feed.setAttribute('aria-busy', 'false');
  }

  function readCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(config.cacheKey));
      return cached && Date.now() - cached.savedAt < config.cacheTtlMs ? cached.payload : null;
    } catch (_) { return null; }
  }

  function writeCache(payload) {
    try { localStorage.setItem(config.cacheKey, JSON.stringify({ savedAt: Date.now(), payload })); } catch (_) { /* Storage is optional. */ }
  }

  async function loadContent() {
    const cached = readCache();
    if (cached && Array.isArray(cached.latestPosts) && cached.latestPosts.filter(safePost).length) {
      renderPosts(cached.latestPosts.filter(safePost));
      return;
    }

    const controller = typeof AbortController === 'undefined' ? null : new AbortController();
    const timer = controller ? window.setTimeout(() => controller.abort(), config.requestTimeoutMs || 3500) : null;
    try {
      const response = await fetch(config.feedUrl, { signal: controller ? controller.signal : undefined, cache: 'no-cache' });
      if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
      const payload = await response.json();
      const posts = Array.isArray(payload.latestPosts) ? payload.latestPosts.filter(safePost) : [];
      if (!posts.length) throw new Error('No approved Instagram posts are available');
      writeCache(payload);
      renderPosts(posts);
    } catch (_) {
      renderFallback('More fresh updates are coming soon. Follow @hakka_bakka.in on Instagram.');
    } finally {
      if (timer) window.clearTimeout(timer);
    }
  }

  loadContent();
}());
