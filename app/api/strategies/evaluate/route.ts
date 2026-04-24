import { NextResponse } from "next/server";
import { evaluateStrategies } from "@/lib/integrations/wundergraph";
import { defaultStrategyModules } from "@/lib/mock-data";
import { writeJson } from "@/lib/integrations/redis";
import type { StrategyModule } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await safeJson<{ strategyModules?: StrategyModule[] }>(request);
  const result = await evaluateStrategies(body?.strategyModules ?? defaultStrategyModules);

  await writeJson("ethos:strategies:last", {
    result,
    updatedAt: new Date().toISOString()
  });

  return NextResponse.json(result);
}

async function safeJson<T>(request: Request): Promise<T | undefined> {
  try {
    return (await request.json()) as T;
  } catch {
    return undefined;
  }
}
