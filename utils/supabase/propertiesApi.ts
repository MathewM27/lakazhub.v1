// ...existing code...

const CACHE_TIME = 15 * 60 * 1000; // 15 minutes

// Example: fetch with ETag
export async function fetchProperty(id: string, etag?: string) {
  const res = await fetch(`/api/properties/${id}`, {
    headers: etag ? { 'If-None-Match': etag } : {}
  });
  if (res.status === 304) {
    return { notModified: true };
  }
  const data = await res.json();
  return { data, etag: res.headers.get('ETag') };
}

// Example: batch endpoint
export async function batchUpdateProperties(updates: Array<{id: string, data: any}>) {
  return fetch('/api/properties/batch', {
    method: 'POST',
    body: JSON.stringify({ updates }),
    headers: { 'Content-Type': 'application/json' }
  });
}

// ...existing code...