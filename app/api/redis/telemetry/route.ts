import { NextResponse } from "next/server";
import { readJson } from "@/lib/integrations/redis";
import { buildRedisTelemetryResponse } from "@/lib/integrations/redis-telemetry";
import type { FinancialTwinPayload } from "@/lib/types";

export const runtime = "nodejs";

const twinKey = "ethos:twin:demo";

export async function GET() {
  const stored = await readJson<Partial<FinancialTwinPayload>>(twinKey);
  const twinId = stored?.financialTwin?.twinId ?? "anonymous";

  const body = await buildRedisTelemetryResponse(twinId);
  return NextResponse.json(body);
}
