// Service Worker — Phonics 300
const CACHE_VERSION = "v1";
const SHELL_CACHE = `phonics-shell-${CACHE_VERSION}`;
const AUDIO_CACHE = `phonics-audio-${CACHE_VERSION}`;
const FONTS_CACHE = `phonics-fonts-${CACHE_VERSION}`;
const ALL_CACHES = [SHELL_CACHE, AUDIO_CACHE, FONTS_CACHE];

const PRECACHE_URLS = ["/", "/units"];

// ─── Install ─────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ───────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension and non-http(s) schemes
  if (!url.protocol.startsWith("http")) return;

  // ── Next.js static assets (hashed, immutable) ──────────
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // ── Audio files ────────────────────────────────────────
  if (url.pathname.startsWith("/assets/audio/") && url.pathname.endsWith(".mp3")) {
    event.respondWith(cacheFirst(request, AUDIO_CACHE));
    return;
  }

  // ── Google Fonts: font files (woff2) ───────────────────
  if (url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request, FONTS_CACHE));
    return;
  }

  // ── Google Fonts: CSS ──────────────────────────────────
  if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(staleWhileRevalidate(request, FONTS_CACHE));
    return;
  }

  // ── HTML navigation requests → network-first ──────────
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // ── Everything else → stale-while-revalidate ──────────
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

// ─── Strategies ──────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    // Offline fallback: return cached root page for any navigation
    return cached || caches.match("/");
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
