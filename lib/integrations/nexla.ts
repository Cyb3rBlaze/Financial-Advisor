import { env, hasValue } from "@/lib/env";
import { defaultMarketSignals } from "@/lib/mock-data";
import type { IntegrationResult, MarketSignal } from "@/lib/types";

export async function getMarketSignals(): Promise<IntegrationResult<MarketSignal[]>> {
  if (!hasValue(env.nexlaAccessToken) || !hasValue(env.nexlaMarketFlowId)) {
    return {
      state: "setup-required",
      detail: "Add NEXLA_ACCESS_TOKEN and NEXLA_MARKET_FLOW_ID for live market data flow status.",
      data: defaultMarketSignals
    };
  }

  try {
    const url = `${env.nexlaApiBaseUrl.replace(/\/$/, "")}/data_flows/${env.nexlaMarketFlowId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.nexlaAccessToken}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Nexla returned ${response.status}`);
    }

    return {
      state: "connected",
      detail: "Nexla market data flow is reachable.",
      data: defaultMarketSignals.map((signal) => ({ ...signal, source: "nexla" }))
    };
  } catch (error) {
    return {
      state: "fallback",
      detail:
        error instanceof Error
          ? `Nexla unavailable, local market signals used: ${error.message}`
          : "Nexla unavailable, local market signals used.",
      data: defaultMarketSignals
    };
  }
}
