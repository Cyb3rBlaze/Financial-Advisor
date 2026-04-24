import { NextResponse } from "next/server";
import { runSimulation, getDefaultSimulationInput } from "@/lib/integrations/monte-carlo";
import { writeJson } from "@/lib/integrations/redis";
import type { SimulationInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await safeJson<Partial<SimulationInput>>(request);
  const input = {
    ...getDefaultSimulationInput(),
    ...body,
    allocation: {
      ...getDefaultSimulationInput().allocation,
      ...body?.allocation
    }
  };
  const result = await runSimulation(input);

  await writeJson("ethos:simulations:last", {
    input,
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
