import Redis from "ioredis";

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  const REDIS_URL = process.env.REDIS_URL;
  if (!REDIS_URL) return null;
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    redisClient.on("error", (err) => {
      console.warn("[Cache] Redis error:", err.message);
    });
  }
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(...keys);
  } catch {
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch {
  }
}
