/**
 * Simple in-memory cache with TTL support
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, value: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const globalCache = new Cache();

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => globalCache.cleanup(), 5 * 60 * 1000);
}
