// Increase cache expiry to 15 minutes
const CACHE_EXPIRY = 15 * 60 * 1000;

// Add ETag support and stale-while-revalidate logic
export async function getPropertyWithCache(id: string, fetcher: (etag?: string) => Promise<{data: any, etag?: string, notModified?: boolean}>) {
  const cacheKey = `property_${id}`;
  const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
  const now = Date.now();

  // Serve cached data if not expired
  if (cached && now - cached.timestamp < CACHE_EXPIRY) {
    // Fire background revalidation
    fetcher(cached.etag).then(fresh => {
      if (!fresh.notModified) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: fresh.data,
          etag: fresh.etag,
          timestamp: Date.now()
        }));
        // Optionally: dispatch an event or callback to update UI
      }
    });
    console.log('[propertyCache] cache hit', id);
    return cached.data;
  }

  // Fetch from server (with ETag if available)
  const fresh = await fetcher(cached?.etag);
  if (fresh.notModified && cached) {
    console.log('[propertyCache] cache hit (304)', id);
    return cached.data;
  }
  localStorage.setItem(cacheKey, JSON.stringify({
    data: fresh.data,
    etag: fresh.etag,
    timestamp: Date.now()
  }));
  console.log('[propertyCache] cache miss', id);
  return fresh.data;
}