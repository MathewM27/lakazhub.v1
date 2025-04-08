/**
 * Optimized rate limiter with lower overhead
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
  blocked: boolean;
}

class RateLimiter {
  private static instance: RateLimiter;
  private records: Map<string, RateLimitRecord> = new Map();
  private lastCleanup = Date.now(); // Track last cleanup
  
  // Rate limit configuration
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
  
  private constructor() {}
  
  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }
  
  public checkLimit(ip: string): { isLimited: boolean; resetTime: Date | null } {
    const now = Date.now();
    
    // Only clean up every CLEANUP_INTERVAL ms instead of on every request
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      queueMicrotask(() => this.cleanupExpiredRecords(now));
      this.lastCleanup = now;
    }
    
    const record = this.records.get(ip);
    
    // Fast path: no record
    if (!record) {
      this.records.set(ip, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
        blocked: false
      });
      return { isLimited: false, resetTime: null };
    }
    
    // Fast path: blocked
    if (record.blocked) {
      // Check if block expired
      if (now > record.resetAt) {
        this.records.set(ip, {
          count: 1,
          resetAt: now + this.WINDOW_MS,
          blocked: false
        });
        return { isLimited: false, resetTime: null };
      }
      return { isLimited: true, resetTime: new Date(record.resetAt) };
    }
    
    // Fast path: window expired
    if (now > record.resetAt) {
      this.records.set(ip, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
        blocked: false
      });
      return { isLimited: false, resetTime: null };
    }
    
    // Normal case: increment and check
    record.count += 1;
    
    // Check if limit exceeded
    if (record.count > this.MAX_ATTEMPTS) {
      record.blocked = true;
      record.resetAt = now + this.BLOCK_DURATION_MS;
      return { isLimited: true, resetTime: new Date(record.resetAt) };
    }
    
    // Update record
    this.records.set(ip, record);
    
    return { isLimited: false, resetTime: null };
  }
  
  public resetLimit(ip: string): void {
    this.records.delete(ip);
  }
  
  private cleanupExpiredRecords(now = Date.now()): void {
    // Batch cleanup in a single pass to avoid multiple iterations
    for (const [ip, record] of this.records.entries()) {
      if (now > record.resetAt && !record.blocked) {
        this.records.delete(ip);
      }
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();
