/**
 * Simple in-memory rate limiter to prevent brute force attacks
 * For production, consider using a Redis-based solution for distributed environments
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
  blocked: boolean;
}

class RateLimiter {
  private static instance: RateLimiter;
  private records: Map<string, RateLimitRecord> = new Map();
  
  // Rate limit configuration
  private readonly MAX_ATTEMPTS = 5; // Maximum attempts within window
  private readonly WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes block
  
  private constructor() {}
  
  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }
  
  /**
   * Check if an IP is rate limited
   * @param ip The IP address to check
   * @returns Object containing isLimited status and reset time
   */
  public checkLimit(ip: string): { isLimited: boolean; resetTime: Date | null } {
    this.cleanupExpiredRecords();
    
    const now = Date.now();
    const record = this.records.get(ip);
    
    // If no record exists or it's expired, create a new one
    if (!record) {
      this.records.set(ip, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
        blocked: false
      });
      return { isLimited: false, resetTime: null };
    }
    
    // If IP is blocked, check if block period has expired
    if (record.blocked) {
      if (now > record.resetAt) {
        // Block period expired, reset the record
        this.records.set(ip, {
          count: 1,
          resetAt: now + this.WINDOW_MS,
          blocked: false
        });
        return { isLimited: false, resetTime: null };
      }
      
      // Still blocked
      return { 
        isLimited: true, 
        resetTime: new Date(record.resetAt)
      };
    }
    
    // Check if window has expired
    if (now > record.resetAt) {
      // Window expired, reset counter
      this.records.set(ip, {
        count: 1,
        resetAt: now + this.WINDOW_MS,
        blocked: false
      });
      return { isLimited: false, resetTime: null };
    }
    
    // Increment counter
    record.count += 1;
    
    // Check if limit exceeded
    if (record.count > this.MAX_ATTEMPTS) {
      // Set blocked status
      record.blocked = true;
      record.resetAt = now + this.BLOCK_DURATION_MS;
      
      return { 
        isLimited: true, 
        resetTime: new Date(record.resetAt)
      };
    }
    
    // Update record
    this.records.set(ip, record);
    
    return { isLimited: false, resetTime: null };
  }
  
  /**
   * Reset rate limit for an IP (e.g., after successful authentication)
   * @param ip The IP address to reset
   */
  public resetLimit(ip: string): void {
    this.records.delete(ip);
  }
  
  /**
   * Clean up expired records to prevent memory leaks
   */
  private cleanupExpiredRecords(): void {
    const now = Date.now();
    for (const [ip, record] of this.records.entries()) {
      if (now > record.resetAt && !record.blocked) {
        this.records.delete(ip);
      }
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();
