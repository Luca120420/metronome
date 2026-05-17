/**
 * coop-sw.js  –  Service Worker for BeatSync
 *
 * GitHub Pages does not send Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy
 * headers, so SharedArrayBuffer (required by FFmpeg.wasm) is unavailable.
 *
 * This SW intercepts every fetch response and adds the two headers that make
 * the page "cross-origin isolated", which unlocks SharedArrayBuffer.
 *
 * DEPLOY: place this file at the ROOT of your GitHub Pages repo (same level as
 * index.html) so its scope covers the whole origin.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  // Only intercept GET requests for navigations and same-origin sub-resources.
  // Pass-through opaque (cross-origin no-cors) requests untouched — adding
  // headers to those would break them.
  const req = event.request;

  // Let the browser handle non-GET requests normally.
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then(response => {
        // Don't tamper with opaque responses (cross-origin no-cors fetches).
        if (response.type === 'opaque') return response;

        const newHeaders = new Headers(response.headers);
        newHeaders.set('Cross-Origin-Opener-Policy',   'same-origin');
        newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');

        return new Response(response.body, {
          status:     response.status,
          statusText: response.statusText,
          headers:    newHeaders,
        });
      })
      .catch(() => fetch(req)) // network error fallback – just try again normally
  );
});
