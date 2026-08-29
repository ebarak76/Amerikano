const CACHE_NAME = 'amerikano-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/']))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests (the app shell + static assets).
  // Everything else — POST/PUT/DELETE, and any cross-origin request such as
  // the Supabase API — must go straight to the network untouched. Intercepting
  // those breaks writes (POSTs can't be cached and returning a non-Response
  // throws "Failed to convert value to 'Response'").
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return
  }

  // Network first, fall back to cache. Always resolve to a real Response.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        return cached || Response.error()
      })
  )
})
