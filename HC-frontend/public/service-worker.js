// HealthLocker Service Worker
// Provides offline support with cache-first strategy for static assets
// IMPORTANT: Never caches sensitive medical data or API auth responses

const CACHE_NAME = 'healthlocker-cache-v5';
const STATIC_CACHE_NAME = 'healthlocker-static-v5';

// Static assets to pre-cache during install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Patterns for resources that should NEVER be cached (security)
// These apply to the URL pathname only — not the full href
const NEVER_CACHE_PATTERNS = [
  /\/api\//,                    // All API responses
  /\/api$/,                     // API root
  /\/api\/auth/,                // Auth API endpoints specifically
  /\/medical-records/,          // Medical record data
  /\/uploads\//,                // Uploaded medical files
  /\/download/,                 // Downloaded records
  /\.env/,                      // Environment variables
];

// File extensions considered as static assets
const STATIC_ASSET_EXTENSIONS = [
  '.js',
  '.css',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
];

// ─── INSTALL EVENT ──────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing HealthLocker SW v1...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching essential assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Activate immediately without waiting for existing clients to close
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Pre-cache failed:', error);
      })
  );
});

// ─── ACTIVATE EVENT ─────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating HealthLocker SW v1...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old cache versions
              return name !== CACHE_NAME && name !== STATIC_CACHE_NAME;
            })
            .map((name) => {
              console.log('[ServiceWorker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// ─── HELPER: Check if a URL should never be cached ─────────────────────────────
function shouldNeverCache(requestUrl) {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(requestUrl.pathname));
}

// ─── HELPER: Check if a request is for a static asset ──────────────────────────
function isStaticAsset(url) {
  return STATIC_ASSET_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

// ─── HELPER: Check if a request is a navigation (page) request ─────────────────
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// ─── FETCH EVENT ────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (e.g., external APIs, fonts CDN is okay)
  if (requestUrl.origin !== self.location.origin &&
      !requestUrl.hostname.includes('fonts.googleapis.com') &&
      !requestUrl.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // NEVER cache sensitive data — pass through to network
  if (shouldNeverCache(requestUrl)) {
    return;
  }

  // ── Strategy: Cache-First for static assets ──
  if (isStaticAsset(requestUrl)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // ── Strategy: Network-First for navigation requests ──
  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirstForNavigation(event.request));
    return;
  }

  // ── Strategy: Cache-First for Google Fonts ──
  if (requestUrl.hostname.includes('fonts.googleapis.com') ||
      requestUrl.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Default: network only
  return;
});

// ─── STRATEGY: Cache-First ──────────────────────────────────────────────────────
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Return cached version, but also update cache in background
      updateCacheInBackground(request);
      return cachedResponse;
    }

    // Not in cache — fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Cache-first fetch failed:', error);
    // Return offline fallback for failed requests
    return caches.match('/') || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// ─── STRATEGY: Network-First for Navigation ─────────────────────────────────────
async function networkFirstForNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the successful navigation response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, serving from cache');
    // For SPA routing, ANY navigation request should fall back to index.html (which is '/')
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    // Deep fallback to offline UI if even '/' is missing
    return new Response(getOfflineFallbackHTML(), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─── BACKGROUND CACHE UPDATE ────────────────────────────────────────────────────
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail — we already have a cached version
  }
}

// ─── OFFLINE FALLBACK HTML ──────────────────────────────────────────────────────
function getOfflineFallbackHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HealthLocker — Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 2rem;
    }
    .offline-container {
      max-width: 480px;
    }
    .offline-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #1B6F63, #2dd4bf);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #f8fafc;
    }
    p {
      font-size: 1rem;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 1.5rem;
    }
    .retry-btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #1B6F63, #2dd4bf);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(27, 111, 99, 0.35);
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="offline-icon">🔒</div>
    <h1>You're Offline</h1>
    <p>
      HealthLocker needs an internet connection to securely access your medical records. 
      Please check your connection and try again.
    </p>
    <button class="retry-btn" onclick="window.location.reload()">
      Try Again
    </button>
  </div>
</body>
</html>`;
}

// ─── MESSAGE HANDLER ────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
