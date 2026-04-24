import { createClient, type RedisClientType } from "redis";
import { env, hasValue } from "@/lib/env";
import type { IntegrationStatus } from "@/lib/types";

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (!hasValue(env.redisUrl)) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  redisClient = createClient({ url: env.redisUrl });
  redisClient.on("error", (error) => {
    console.error("Redis client error", error);
  });
  await redisClient.connect();

  return redisClient;
}

export async function readJson<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();

  if (!client) {
    return null;
  }

  const raw = await client.get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function writeJson(key: string, value: unknown, ttlSeconds?: number) {
  const client = await getRedisClient();

  if (!client) {
    return false;
  }

  const payload = JSON.stringify(value);

  if (ttlSeconds) {
    await client.set(key, payload, { EX: ttlSeconds });
  } else {
    await client.set(key, payload);
  }

  return true;
}

export async function redisStatus(): Promise<IntegrationStatus> {
  if (!hasValue(env.redisUrl)) {
    return {
      name: "Redis",
      state: "setup-required",
      detail: "Add REDIS_URL to persist the financial twin and advisor actions."
    };
  }

  try {
    const client = await getRedisClient();
    await client?.ping();

    return {
      name: "Redis",
      state: "connected",
      detail: "Twin JSON + sorted-set timeline (capped) and INFO memory telemetry available."
    };
  } catch (error) {
    return {
      name: "Redis",
      state: "error",
      detail: error instanceof Error ? error.message : "Redis connection failed."
    };
  }
}
