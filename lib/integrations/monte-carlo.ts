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

  const endingLabel = formatCurrency(value);
  const mix = `VTI ${Math.round(input.allocation.VTI * 100)} / VXUS ${Math.round(
    input.allocation.VXUS * 100
  )} / BND ${Math.round(input.allocation.BND * 100)}`;

  const { comfortPath, comfortNarrative } = retirementComfortPlacement(name, endingLabel, input.years);

  return {
    name,
    annualReturn: formatPercent(annualReturn),
    volatility: formatPercent(volatility),
    endingValue: endingLabel,
    confidence: comfortPath,
    allocation: `${comfortNarrative} Mock glidepath mix: ${mix}.`
  };
}

/** Plain-language “are you placed to retire comfortably?” copy for mock paths (not a plan recommendation). */
function retirementComfortPlacement(
  name: ScenarioProjection["name"],
  endingLabel: string,
  years: number
): { comfortPath: string; comfortNarrative: string } {
  if (name === "Bull") {
    return {
      comfortPath: "Comfort: ahead of corridor",
      comfortNarrative: `Strong equity tailwinds lift the mock stack to about ${endingLabel} after ${years} years — well inside a comfortable retirement band for many wage-replacement targets, with room to absorb lifestyle creep or retire a bit earlier if policy and health stay favorable.`
    };
  }

  if (name === "Average") {
    return {
      comfortPath: "Comfort: on track",
      comfortNarrative: `Middle-of-the-road returns land near ${endingLabel} — consistent with retiring on a conventional timeline if real spending stays near plan, fixed costs stay hedged, and you keep insurance gaps closed through the first decade of draws.`
    };
  }

  if (name === "Bear") {
    return {
      comfortPath: "Comfort: stretched",
      comfortNarrative: `A prolonged slump leaves roughly ${endingLabel} — below a typical “sleep well” comfort zone unless you extend work a few years, lift savings, or trim retirement cash flow; the mock investor would revisit date-of-retirement before calling the plan comfortable.`
    };
  }

  if (name === "Stagflation") {
    return {
      comfortPath: "Comfort: inflation shock",
      comfortNarrative: `Stagnant real returns with elevated volatility drag the mock ending near ${endingLabel} — comfortable retirement usually needs higher guaranteed-income share or lower real spending until inflation breaks.`
    };
  }

  if (name === "Lost Decade") {
    return {
      comfortPath: "Comfort: sequence-hit",
      comfortNarrative: `Early negative paths compress compounding to about ${endingLabel} — classic sequence-of-returns stress; mock posture is delay draws, build TIPS/bond runway, or phase retirement rather than fixed-date exit.`
    };
  }

  return {
    comfortPath: "Comfort: review",
    comfortNarrative: `Scenario ${name} ends near ${endingLabel} — treat as a planning stress label, not a forecast.`
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
