import { NextResponse } from "next/server";
import { createActionBrowserSession } from "@/lib/integrations/tinyfish";
import { writeJson } from "@/lib/integrations/redis";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await createActionBrowserSession();

    await writeJson("ethos:actions:last-browser", {
      result,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        state: "error",
        detail: error instanceof Error ? error.message : "Tinyfish browser session failed.",
        data: {}
      },
      { status: 502 }
    );
  }
}
