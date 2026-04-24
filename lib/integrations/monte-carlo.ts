import { env, hasValue } from "@/lib/env";
import type { IntegrationResult, ScenarioProjection, SimulationInput } from "@/lib/types";

const assetAssumptions = {
  VTI: { mean: 0.071, volatility: 0.155 },
  VXUS: { mean: 0.058, volatility: 0.17 },
  BND: { mean: 0.032, volatility: 0.055 }
};

const defaultSimulationInput: SimulationInput = {
  initialValue: 950000,
  annualContribution: 62000,
  years: 20,
  allocation: {
    VTI: 0.5,
    VXUS: 0.25,
    BND: 0.25
  }
};

export function getDefaultSimulationInput() {
  return defaultSimulationInput;
}

export async function runSimulation(
  input: SimulationInput = defaultSimulationInput
): Promise<IntegrationResult<ScenarioProjection[]>> {
  if (hasValue(env.akashDeploymentApiUrl)) {
    try {
      const response = await fetch(env.akashDeploymentApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(hasValue(env.akashApiKey) ? { Authorization: `Bearer ${env.akashApiKey}` } : {})
        },
        body: JSON.stringify({ operation: "monte_carlo", input })
      });

      if (!response.ok) {
        throw new Error(`Akash simulation failed with ${response.status}`);
      }

      const data = (await response.json()) as { projections?: ScenarioProjection[] };

      if (Array.isArray(data.projections)) {
        return {
          state: "connected",
          detail: "Simulation completed on the configured Akash compute endpoint.",
          data: data.projections
        };
      }
    } catch (error) {
      return {
        state: "fallback",
        detail:
          error instanceof Error
            ? `Akash unavailable, local simulation used: ${error.message}`
            : "Akash unavailable, local simulation used.",
        data: localMonteCarlo(input)
      };
    }
  }

  return {
    state: "fallback",
    detail: "Add AKASH_DEPLOYMENT_API_URL to run heavy simulations on Akash.",
    data: localMonteCarlo(input)
  };
}

function localMonteCarlo(input: SimulationInput): ScenarioProjection[] {
  const weightedMean =
    input.allocation.VTI * assetAssumptions.VTI.mean +
    input.allocation.VXUS * assetAssumptions.VXUS.mean +
    input.allocation.BND * assetAssumptions.BND.mean;
  const weightedVolatility = Math.sqrt(
    Math.pow(input.allocation.VTI * assetAssumptions.VTI.volatility, 2) +
      Math.pow(input.allocation.VXUS * assetAssumptions.VXUS.volatility, 2) +
      Math.pow(input.allocation.BND * assetAssumptions.BND.volatility, 2)
  );

  return [
    projectScenario("Bull", weightedMean + weightedVolatility * 0.45, weightedVolatility, input),
    projectScenario("Average", weightedMean, weightedVolatility, input),
    projectScenario("Bear", Math.max(0.004, weightedMean - weightedVolatility * 0.5), weightedVolatility, input),
    projectScenario("Stagflation", Math.max(0.002, weightedMean - weightedVolatility * 0.62), weightedVolatility * 1.2, input),
    projectScenario("Lost Decade", Math.max(0.001, weightedMean - weightedVolatility * 0.72), weightedVolatility * 0.95, input)
  ];
}

function projectScenario(
  name: ScenarioProjection["name"],
  annualReturn: number,
  volatility: number,
  input: SimulationInput
): ScenarioProjection {
  let value = input.initialValue;

  for (let year = 0; year < input.years; year += 1) {
    value = value * (1 + annualReturn) + input.annualContribution;
  }

  return {
    name,
    annualReturn: formatPercent(annualReturn),
    volatility: formatPercent(volatility),
    endingValue: formatCurrency(value),
    confidence:
      name === "Bull"
        ? "Top quartile"
        : name === "Average"
          ? "Median path"
          : name === "Stagflation"
            ? "Inflation stress"
            : name === "Lost Decade"
              ? "Sequence risk"
              : "Stress case",
    allocation: `VTI ${Math.round(input.allocation.VTI * 100)} / VXUS ${Math.round(
      input.allocation.VXUS * 100
    )} / BND ${Math.round(input.allocation.BND * 100)}`
  };
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact"
  }).format(value);
}
