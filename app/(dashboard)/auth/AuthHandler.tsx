// ...existing code...

const PROFILE_CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

export async function getProfileWithCache(
  userId: string,
  fetcher: (etag?: string) => Promise<{ data: unknown, etag?: string, notModified?: boolean }>
) {
  const cacheKey = `profile_${userId}`;
  const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
  const now = Date.now();

  if (cached && now - cached.timestamp < PROFILE_CACHE_EXPIRY) {
    fetcher(cached.etag).then(fresh => {
      if (!fresh.notModified) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: fresh.data,
          etag: fresh.etag,
          timestamp: Date.now()
        }));
      }
    });
    return cached.data;
  }

  const fresh = await fetcher(cached?.etag);
  if (fresh.notModified && cached) {
    return cached.data;
  }
  localStorage.setItem(cacheKey, JSON.stringify({
    data: fresh.data,
    etag: fresh.etag,
    timestamp: Date.now()
  }));
  return fresh.data;
}

// ...existing code...