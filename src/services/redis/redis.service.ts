import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}
  /**
   *
   * @param key  // 🔑 Redis key (e.g. "otp:user:123")
   * @param value  // 🔐 Any value (e.g. "432198")
   * @param hash  // 🧾 Unique alphanumeric hash shown to user (e.g. "A1B2C")
   * @param ttl  // ⏳ TTL in seconds (default = 5 minutes)
   */
  async setValue(
    key: string,
    value: string,
    hash: string,
    ttl = 300,
  ): Promise<void> {
    await this.redis
      .multi()
      .hmset(key, { value, hash }) // store OTP + hash
      .expire(key, ttl) // set TTL in seconds
      .exec();
  }

  /**
   * Get a hash-based session object from Redis
   * @param key Redis key
   * @param hash Optional hash to verify before returning session
   * @returns The session data (e.g. { otp: '123456', hash: 'A1B2C' }) or null
   */
  async getSession<T extends Record<string, string>>(
    key: string,
    hash?: string,
  ): Promise<T | null> {
    const data = await this.redis.hgetall(key);
    if (!data || Object.keys(data).length === 0) return null;

    // If hash is passed, verify it matches before returning
    if (hash && data.hash !== hash) return null;

    return data as T;
  }

  /**
   * Delete a session key
   * @param key Redis key
   * @param hash Optional hash to verify before deletion
   * @returns Number of keys deleted (0 or 1)
   */
  async deleteSession(key: string, hash?: string): Promise<number> {
    if (hash) {
      const data = await this.redis.hget(key, 'hash');
      if (data !== hash) return 0; // don't delete if hash doesn't match
    }

    return await this.redis.del(key);
  }
  async invalidateSession(userId: string, providedHash: string): Promise<number> {
    const redisKey = `otp:user:${userId}`;
  const storedHash = await this.redis.hget(redisKey, 'hash');

  if (!storedHash || storedHash !== providedHash) {
    return 0; // Don't delete anything if hash doesn't match
  }

  return await this.redis.del(redisKey);
  }
  /**
   * 
   * @returns Ping information for redis
   */
  async ping(): Promise<string> {
    return await this.redis.ping();
  }

  // ─── Refresh Token Helpers ───────────────────────────────────────────────────

  /**
   * Store a refresh token string for a user.
   * @param userId  User ID (used as part of the Redis key)
   * @param token   The refresh token JWT string
   * @param ttl     TTL in seconds (should match JWT expiry — default 900 = 15 min)
   */
  async setRefreshToken(userId: string, token: string, ttl = 900): Promise<void> {
    await this.redis.set(`refresh:${userId}`, token, 'EX', ttl);
  }

  /**
   * Retrieve the stored refresh token for a user.
   * Returns null if the key does not exist (expired or never set).
   */
  async getRefreshToken(userId: string): Promise<string | null> {
    return await this.redis.get(`refresh:${userId}`);
  }

  /**
   * Delete (invalidate) a user's refresh token.
   * Call this on logout or password change.
   */
  async deleteRefreshToken(userId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}`);
  }
}
