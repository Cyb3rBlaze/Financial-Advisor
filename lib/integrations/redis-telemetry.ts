import { getRedisClient } from "@/lib/integrations/redis";
import type { RedisMemorySnapshot, RedisTelemetryResponse, TwinTimelineEvent } from "@/lib/types";

const TIMELINE_KEY = (twinId: string) => `ethos:timeline:${twinId}`;
/** Hard cap on ZSET cardinality — bounded memory for advisor audit trail (timescale via score). */
export const TWIN_TIMELINE_MAX_EVENTS = 500;
const SESSION_FP_KEY = (twinId: string) => `ethos:session:fp:${twinId}`;
const SESSION_FP_TTL_SEC = 86_400;

function cmdString(value: unknown): string {
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return String(value ?? "");
}

function cmdNumber(value: unknown): number {
  const s = cmdString(value);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Append-only timeline on a sorted set: score = epoch ms (natural time ordering / range queries).
 * Trims oldest ranks when over TWIN_TIMELINE_MAX_EVENTS so Redis RSS stays predictable.
 */
export async function appendTwinTimelineEvent(
  twinId: string,
  action: string,
  summary: string
): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  const scoreMs = Date.now();
  const id = `${scoreMs}-${crypto.randomUUID().slice(0, 8)}`;
  const member = JSON.stringify({
    id,
    at: new Date(scoreMs).toISOString(),
    action,
    summary: summary.slice(0, 900)
  });

  const key = TIMELINE_KEY(twinId);
  await client.sendCommand(["ZADD", key, String(scoreMs), member]);

  const card = cmdNumber(await client.sendCommand(["ZCARD", key]));
  if (card > TWIN_TIMELINE_MAX_EVENTS) {
    const remove = card - TWIN_TIMELINE_MAX_EVENTS;
    await client.sendCommand(["ZREMRANGEBYRANK", key, "0", String(remove - 1)]);
  }

  return true;
}

/** Ephemeral SET with TTL — proves last dashboard / API touch without growing cold JSON blobs. */
export async function touchTwinSessionFingerprint(twinId: string, source: string): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) return false;

  const payload = JSON.stringify({
    lastSeenMs: Date.now(),
    lastSeenIso: new Date().toISOString(),
    source: source.slice(0, 120)
  });

  await client.sendCommand(["SET", SESSION_FP_KEY(twinId), payload, "EX", String(SESSION_FP_TTL_SEC)]);
  return true;
}

export async function fetchTwinTimeline(twinId: string, limit: number): Promise<TwinTimelineEvent[]> {
  const client = await getRedisClient();
  if (!client) return [];

  const n = Math.min(Math.max(limit, 1), 100);
  const raw = await client.sendCommand(["ZRANGE", TIMELINE_KEY(twinId), "0", String(n - 1), "REV", "WITHSCORES"]);
  const flat = Array.isArray(raw) ? raw.map(cmdString) : [];

  const out: TwinTimelineEvent[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    try {
      const parsed = JSON.parse(flat[i]!) as {
        id?: string;
        at?: string;
        action?: string;
        summary?: string;
      };
      const scoreMs = Number(flat[i + 1]);
      out.push({
        id: typeof parsed.id === "string" ? parsed.id : flat[i]!.slice(0, 32),
        scoreMs: Number.isFinite(scoreMs) ? scoreMs : Date.now(),
        at: typeof parsed.at === "string" ? parsed.at : new Date().toISOString(),
        action: typeof parsed.action === "string" ? parsed.action : "UNKNOWN",
        summary: typeof parsed.summary === "string" ? parsed.summary : ""
      });
    } catch {
      continue;
    }
  }
  return out;
}

export async function fetchTimelineCardinality(twinId: string): Promise<number> {
  const client = await getRedisClient();
  if (!client) return 0;
  return cmdNumber(await client.sendCommand(["ZCARD", TIMELINE_KEY(twinId)]));
}

export async function readSessionFingerprint(twinId: string): Promise<{ lastSeenIso: string; source: string } | null> {
  const client = await getRedisClient();
  if (!client) return null;

  const raw = await client.sendCommand(["GET", SESSION_FP_KEY(twinId)]);
  const s = cmdString(raw);
  if (!s) return null;
  try {
    const o = JSON.parse(s) as { lastSeenIso?: string; source?: string };
    if (typeof o.lastSeenIso !== "string") return null;
    return { lastSeenIso: o.lastSeenIso, source: typeof o.source === "string" ? o.source : "unknown" };
  } catch {
    return null;
  }
}

export async function getRedisMemorySnapshot(): Promise<RedisMemorySnapshot | null> {
  const client = await getRedisClient();
  if (!client) return null;

  const raw = cmdString(await client.sendCommand(["INFO", "memory"]));
  const lines = raw.split(/\r?\n/);
  const map = new Map<string, string>();
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > 0) map.set(line.slice(0, idx), line.slice(idx + 1));
  }

  const used = map.get("used_memory");
  const usedHuman = map.get("used_memory_human") ?? "n/a";
  const maxRaw = map.get("maxmemory");
  const maxmem = maxRaw && maxRaw !== "0" ? Number(maxRaw) : null;
  const maxHuman = map.get("maxmemory_human");
  const policy = map.get("maxmemory_policy") ?? "noeviction";
  const frag = map.get("mem_fragmentation_ratio");
  const fragN = frag ? Number(frag) : null;

  return {
    usedMemoryBytes: used ? Number(used) : 0,
    usedMemoryHuman: usedHuman,
    maxmemoryBytes: maxmem,
    maxmemoryHuman: maxHuman && maxHuman.length > 0 ? maxHuman : null,
    maxmemoryPolicy: policy,
    memFragmentationRatio: fragN !== null && Number.isFinite(fragN) ? fragN : null
  };
}

export async function buildRedisTelemetryResponse(twinId: string): Promise<RedisTelemetryResponse> {
  const client = await getRedisClient();
  if (!client) {
    return {
      redisAvailable: false,
      memory: null,
      timeline: [],
      timelineTotal: 0,
      timelineCap: TWIN_TIMELINE_MAX_EVENTS,
      sessionFingerprint: null,
      sessionTtlSeconds: SESSION_FP_TTL_SEC
    };
  }

  const [memory, timeline, total, fp] = await Promise.all([
    getRedisMemorySnapshot(),
    fetchTwinTimeline(twinId, 25),
    fetchTimelineCardinality(twinId),
    readSessionFingerprint(twinId)
  ]);

  return {
    redisAvailable: true,
    memory,
    timeline,
    timelineTotal: total,
    timelineCap: TWIN_TIMELINE_MAX_EVENTS,
    sessionFingerprint: fp,
    sessionTtlSeconds: SESSION_FP_TTL_SEC
  };
}
