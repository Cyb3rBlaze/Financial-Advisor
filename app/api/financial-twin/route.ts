import { NextResponse } from "next/server";
import { getIntegrationStatuses } from "@/lib/integrations/status";
import { getMarketSignals } from "@/lib/integrations/nexla";
import { readJson, writeJson } from "@/lib/integrations/redis";
import type { FinancialTwin, FinancialTwinPayload, TaxProfile } from "@/lib/types";

export const runtime = "nodejs";

const twinKey = "ethos:twin:demo";

type CreateTwinRequest = {
  household?: string;
  advisor?: string;
  riskProfile?: FinancialTwin["riskProfile"];
  currentLifeNode?: string;
  stateOfResidence?: string;
  filingStatus?: string;
  contingencyReserve?: number;
  taxEfficiencyScore?: number;
  dependents?: number;
};

export async function GET() {
  const storedTwin = await readJson<Partial<FinancialTwinPayload>>(twinKey);
  const marketSignals = await getMarketSignals();
  const integrationStatuses = await getIntegrationStatuses();

  if (!storedTwin?.financialTwin) {
    return NextResponse.json(emptyPayload(integrationStatuses, []));
  }

  return NextResponse.json({
    ...emptyPayload(integrationStatuses, marketSignals.data),
    ...storedTwin,
    hasTwin: true,
    integrationStatuses,
    marketSignals: marketSignals.data
  } satisfies FinancialTwinPayload);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateTwinRequest;
  const now = new Date().toISOString();
  const household = clean(body.household) || "Untitled Household";
  const stateOfResidence = clean(body.stateOfResidence) || "Not set";
  const filingStatus = clean(body.filingStatus) || "Not set";

  const financialTwin: FinancialTwin = {
    household,
    advisor: clean(body.advisor) || "Unassigned advisor",
    riskProfile: body.riskProfile ?? "Balanced Growth",
    timeHorizon: "User-defined",
    contingencyReserve: clampNumber(body.contingencyReserve, 0, 60, 0),
    taxEfficiencyScore: clampNumber(body.taxEfficiencyScore, 0, 100, 0),
    privacyMode: "Local-first",
    twinId: `twin_${crypto.randomUUID()}`,
    currentLifeNode: clean(body.currentLifeNode) || "Unclassified",
    stateOfResidence,
    filingStatus,
    lastEvaluatedAt: now
  };

  const taxProfile: TaxProfile = {
    filingStatus,
    state: stateOfResidence,
    dependents: clampNumber(body.dependents, 0, 20, 0),
    priorYearAgiToken: "[NOT_PROVIDED]",
    carryforwardLossesToken: "[NOT_PROVIDED]",
    amtStatus: "not-exposed",
    qbiEligibility: "unknown"
  };

  const integrationStatuses = await getIntegrationStatuses();
  const marketSignals = await getMarketSignals();
  const payload: FinancialTwinPayload = {
    hasTwin: true,
    financialTwin,
    taxProfile,
    consentRecords: [],
    lifecycleNodes: [],
    lifeEvents: [],
    strategyModules: [],
    projections: [],
    privacyBoundaries: [],
    privacyThreats: [],
    agenticIntents: [],
    auditLog: [
      {
        actor: "user",
        action: "TWIN_INITIALIZED",
        payloadHash: `sha256:${financialTwin.twinId.slice(-12)}`,
        outcome: "Financial Twin created from local onboarding form",
        timestamp: now,
        signature: "local-dev"
      }
    ],
    apiSurface: [],
    documentAnalyses: [],
    integrationStatuses,
    marketSignals: marketSignals.data
  };

  await writeJson(twinKey, payload);

  return NextResponse.json(payload, { status: 201 });
}

function emptyPayload(
  integrationStatuses: FinancialTwinPayload["integrationStatuses"],
  marketSignals: FinancialTwinPayload["marketSignals"]
): FinancialTwinPayload {
  return {
    hasTwin: false,
    financialTwin: null,
    taxProfile: null,
    consentRecords: [],
    lifecycleNodes: [],
    lifeEvents: [],
    strategyModules: [],
    projections: [],
    privacyBoundaries: [],
    privacyThreats: [],
    agenticIntents: [],
    auditLog: [],
    apiSurface: [],
    documentAnalyses: [],
    integrationStatuses,
    marketSignals
  };
}

function clean(value: string | undefined) {
  return value?.trim();
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
