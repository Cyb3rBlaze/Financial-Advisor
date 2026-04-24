import { NextResponse } from "next/server";
import { getIntegrationStatuses } from "@/lib/integrations/status";
import { getMarketSignals } from "@/lib/integrations/nexla";
import { readJson, writeJson } from "@/lib/integrations/redis";
import { appendTwinTimelineEvent, touchTwinSessionFingerprint } from "@/lib/integrations/redis-telemetry";
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

  await touchTwinSessionFingerprint(storedTwin.financialTwin.twinId, "GET /api/financial-twin");

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
  await appendTwinTimelineEvent(
    financialTwin.twinId,
    "TWIN_CREATED",
    "Financial twin persisted to primary JSON key; timeline ZSET initialized."
  );
  await touchTwinSessionFingerprint(financialTwin.twinId, "POST /api/financial-twin");

  return NextResponse.json(payload, { status: 201 });
}

export async function PATCH(request: Request) {
  const storedTwin = await readJson<Partial<FinancialTwinPayload>>(twinKey);

  if (!storedTwin?.financialTwin) {
    return NextResponse.json({ error: "Twin not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateTwinRequest;
  const now = new Date().toISOString();

  const updatedTwin: FinancialTwinPayload = {
    ...(storedTwin as FinancialTwinPayload),
    financialTwin: {
      ...storedTwin.financialTwin,
      household: body.household ? clean(body.household) || "Untitled Household" : storedTwin.financialTwin.household,
      advisor: body.advisor ? clean(body.advisor) || "Unassigned advisor" : storedTwin.financialTwin.advisor,
      riskProfile: body.riskProfile ?? storedTwin.financialTwin.riskProfile,
      contingencyReserve: body.contingencyReserve !== undefined ? clampNumber(body.contingencyReserve, 0, 60, 0) : storedTwin.financialTwin.contingencyReserve,
      taxEfficiencyScore: body.taxEfficiencyScore !== undefined ? clampNumber(body.taxEfficiencyScore, 0, 100, 0) : storedTwin.financialTwin.taxEfficiencyScore,
      currentLifeNode: body.currentLifeNode ? clean(body.currentLifeNode) || "Unclassified" : storedTwin.financialTwin.currentLifeNode,
      stateOfResidence: body.stateOfResidence ? clean(body.stateOfResidence) || "Not set" : storedTwin.financialTwin.stateOfResidence,
      filingStatus: body.filingStatus ? clean(body.filingStatus) || "Not set" : storedTwin.financialTwin.filingStatus,
      lastEvaluatedAt: now
    },
    taxProfile: storedTwin.taxProfile ? {
      ...storedTwin.taxProfile,
      filingStatus: body.filingStatus ? clean(body.filingStatus) || "Not set" : storedTwin.taxProfile.filingStatus,
      state: body.stateOfResidence ? clean(body.stateOfResidence) || "Not set" : storedTwin.taxProfile.state,
      dependents: body.dependents !== undefined ? clampNumber(body.dependents, 0, 20, 0) : storedTwin.taxProfile.dependents,
    } : null,
    auditLog: [
      {
        actor: "user",
        action: "TWIN_UPDATED",
        payloadHash: `sha256:${storedTwin.financialTwin.twinId.slice(-12)}`,
        outcome: "Financial Twin updated via manual edit",
        timestamp: now,
        signature: "local-dev"
      },
      ...(storedTwin.auditLog ?? [])
    ]
  };

  await writeJson(twinKey, updatedTwin);
  const twinRow = updatedTwin.financialTwin;
  if (twinRow) {
    await appendTwinTimelineEvent(
      twinRow.twinId,
      "TWIN_PATCHED",
      "Twin profile fields updated; audit log row prepended in payload."
    );
    await touchTwinSessionFingerprint(twinRow.twinId, "PATCH /api/financial-twin");
  }

  return NextResponse.json(updatedTwin, { status: 200 });
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
