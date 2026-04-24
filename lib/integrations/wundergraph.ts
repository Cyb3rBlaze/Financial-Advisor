import { env, hasValue } from "@/lib/env";
import type { IntegrationResult, StrategyModule } from "@/lib/types";

export async function evaluateStrategies(
  modules: StrategyModule[]
): Promise<IntegrationResult<StrategyModule[]>> {
  if (!hasValue(env.wunderGraphOperationsUrl)) {
    return {
      state: "setup-required",
      detail: "Add WUNDERGRAPH_OPERATIONS_URL to route strategy modules through trusted operations.",
      data: modules
    };
  }

  try {
    const response = await fetch(env.wunderGraphOperationsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(hasValue(env.wunderGraphApiKey) ? { Authorization: `Bearer ${env.wunderGraphApiKey}` } : {})
      },
      body: JSON.stringify({
        operationName: "EvaluateEthosStrategies",
        variables: {
          intents: modules.map((module) => ({
            title: module.title,
            module: module.module,
            tokens: module.tokens
          }))
        }
      })
    });

    if (!response.ok) {
      throw new Error(`WunderGraph returned ${response.status}`);
    }

    const payload = (await response.json()) as { strategyModules?: StrategyModule[]; data?: { strategyModules?: StrategyModule[] } };
    const strategyModules = payload.strategyModules ?? payload.data?.strategyModules;

    return {
      state: "connected",
      detail: "Strategy modules evaluated through the configured operations gateway.",
      data: Array.isArray(strategyModules) ? strategyModules : modules
    };
  } catch (error) {
    return {
      state: "fallback",
      detail:
        error instanceof Error
          ? `WunderGraph unavailable, local strategy rules used: ${error.message}`
          : "WunderGraph unavailable, local strategy rules used.",
      data: modules
    };
  }
}
