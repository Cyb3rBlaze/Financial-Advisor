import { NextResponse } from "next/server";
import { createActionBrowserSession } from "@/lib/integrations/tinyfish";
import { env, hasValue } from "@/lib/env";

export const maxDuration = 120;

export async function POST() {
  if (!hasValue(env.tinyfishApiKey)) {
    return NextResponse.json(
      {
        state: "setup-required",
        detail: "Tinyfish is not configured. Add TINYFISH_API_KEY to .env."
      },
      { status: 400 }
    );
  }

  try {
    const result = await createActionBrowserSession();

    if (result.state === "setup-required") {
      return NextResponse.json(result, { status: 400 });
    }

    const session = result.data;
    const url = session.base_url;

    return NextResponse.json({
      state: result.state,
      detail: result.detail,
      data: { ...session, url }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tinyfish session creation failed.";
    console.error("Tinyfish create session failed:", message);
    return NextResponse.json(
      {
        state: "error",
        detail: message,
        data: {}
      },
      { status: 502 }
    );
  }
}