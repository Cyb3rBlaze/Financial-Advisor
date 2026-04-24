import { env, hasValue } from "@/lib/env";
import type { IntegrationResult } from "@/lib/types";

type TinyfishSession = {
  session_id?: string;
  cdp_url?: string;
  base_url?: string;
};

export async function createActionBrowserSession(): Promise<IntegrationResult<TinyfishSession>> {
  if (!hasValue(env.tinyfishApiKey)) {
    return {
      state: "setup-required",
      detail: "Add TINYFISH_API_KEY to create isolated browser action sessions.",
      data: {}
    };
  }

  const response = await fetch("https://api.browser.tinyfish.ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env.tinyfishApiKey
    },
    body: JSON.stringify({
      url: env.tinyfishActionUrl,
      timeout_seconds: 300
    })
  });

  if (!response.ok) {
    throw new Error(`Tinyfish returned ${response.status}`);
  }

  return {
    state: "connected",
    detail: "Isolated browser session created for advisor-approved action.",
    data: (await response.json()) as TinyfishSession
  };
}
