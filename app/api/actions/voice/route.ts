import { NextResponse } from "next/server";
import { createAdvisorVoiceCall } from "@/lib/integrations/vapi";
import { writeJson } from "@/lib/integrations/redis";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await createAdvisorVoiceCall();

    await writeJson("ethos:actions:last-voice", {
      result,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        state: "error",
        detail: error instanceof Error ? error.message : "Vapi call failed.",
        data: {}
      },
      { status: 502 }
    );
  }
}
