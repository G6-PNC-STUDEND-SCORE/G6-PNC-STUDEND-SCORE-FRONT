/**
 * Lightweight localStorage cache with TTL.
 * Data is shown instantly from cache, then refreshed from API in background.
 */
const CACHE_PREFIX = 'fc_'

interface CacheEntry<T> {
  data: T
  expiry: number
}

function getKey(name: string): string {
  return CACHE_PREFIX + name
}

export const cacheService = {
  get<T>(name: string): T | null {
    try {
      const raw = localStorage.getItem(getKey(name))
      if (!raw) return null
      const entry: CacheEntry<T> = JSON.parse(raw)
      // Return data even if expired — caller can refresh in background
      return entry.data
    } catch {
      return null
    }
  },

  set<T>(name: string, data: T, ttlMs = 60_000): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        expiry: Date.now() + ttlMs,
      }
      localStorage.setItem(getKey(name), JSON.stringify(entry))
    } catch {
      // localStorage full — silently fail
    }
  },

  isFresh(name: string): boolean {
    try {
      const raw = localStorage.getItem(getKey(name))
      if (!raw) return false
      const entry: CacheEntry<unknown> = JSON.parse(raw)
      return Date.now() < entry.expiry
    } catch {
      return false
    }
  },

  remove(name: string): void {
    localStorage.removeItem(getKey(name))
  },
}
