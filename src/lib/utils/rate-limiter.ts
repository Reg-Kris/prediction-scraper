/**
 * Rate limiter utility for API requests
 */

export class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();

    // Remove timestamps outside the current window
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.windowMs
    );

    if (this.requestTimes.length >= this.maxRequests) {
      // Calculate how long to wait
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // Recursively check again after waiting
      return this.wait();
    }

    this.requestTimes.push(now);
  }

  reset(): void {
    this.requestTimes = [];
  }
}
