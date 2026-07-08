// Tiny in-process TTL cache used to avoid recomputing expensive aggregation
// pipelines (analytics) on every request. Keyed per-organization so tenants
// never share cached data. Good enough for a single-instance deployment;
// swap for Redis if you scale to multiple server instances.
const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttlMs = 30_000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Call after any write (create/delete feedback) so stale analytics aren't served.
function invalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

module.exports = { get, set, invalidate };
