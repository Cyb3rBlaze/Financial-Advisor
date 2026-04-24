import { NextResponse } from "next/server";
import { extractDocuments } from "@/lib/documents/extract";
import { analyzeDocumentsWithOpenAI } from "@/lib/integrations/openai-documents";
import { getIntegrationStatuses } from "@/lib/integrations/status";
import { getMarketSignals } from "@/lib/integrations/nexla";
import { readJson, writeJson } from "@/lib/integrations/redis";
import type { FinancialTwin, FinancialTwinPayload, TaxProfile } from "@/lib/types";

export const runtime = "nodejs";

const twinKey = "ethos:twin:demo";
const maxFiles = 6;
const maxFileSizeBytes = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const consent = formData.get("consent");

  if (consent !== "true") {
    return NextResponse.json(
      {
        state: "blocked",
        detail: "Document analysis requires explicit consent because uploaded document text is sent to OpenAI when configured."
      },
      { status: 400 }
    );
  }

  const files = formData.getAll("documents").filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ state: "blocked", detail: "Upload at least one supported document." }, { status: 400 });
  }

  if (files.length > maxFiles) {
    return NextResponse.json({ state: "blocked", detail: `Upload ${maxFiles} files or fewer.` }, { status: 400 });
  }

  for (const file of files) {
    if (file.size > maxFileSizeBytes) {
      return NextResponse.json(
        { state: "blocked", detail: `${file.name} is larger than 12MB.` },
        { status: 400 }
      );
    }
  }

  const storedTwin = await readJson<Partial<FinancialTwinPayload>>(twinKey);
  const basePayload = await payloadFromStoredTwin(storedTwin);
  const extracted = await extractDocuments(files);
  const analysis = await analyzeDocumentsWithOpenAI({ documents: extracted, currentPayload: basePayload });
  const mergedPayload = mergeAnalysis(basePayload, analysis);

  await writeJson(twinKey, mergedPayload);

  return NextResponse.json({
    state: analysis.status,
    detail:
      analysis.status === "completed"
        ? "Documents analyzed and Financial Twin updated."
        : "Documents extracted locally, but OpenAI analysis is not configured.",
    data: {
      analysis,
      payload: mergedPayload
    }
  });
}

async function payloadFromStoredTwin(
  storedTwin: Partial<FinancialTwinPayload> | null
): Promise<FinancialTwinPayload> {
  const integrationStatuses = await getIntegrationStatuses();
  const marketSignals = await getMarketSignals();

  return {
    hasTwin: Boolean(storedTwin?.financialTwin),
    financialTwin: storedTwin?.financialTwin ?? null,
    taxProfile: storedTwin?.taxProfile ?? null,
    consentRecords: storedTwin?.consentRecords ?? [],
    lifecycleNodes: storedTwin?.lifecycleNodes ?? [],
    lifeEvents: storedTwin?.lifeEvents ?? [],
    strategyModules: storedTwin?.strategyModules ?? [],
    projections: storedTwin?.projections ?? [],
    privacyBoundaries: storedTwin?.privacyBoundaries ?? [],
    privacyThreats: storedTwin?.privacyThreats ?? [],
    agenticIntents: storedTwin?.agenticIntents ?? [],
    auditLog: storedTwin?.auditLog ?? [],
    apiSurface: storedTwin?.apiSurface ?? [],
    documentAnalyses: storedTwin?.documentAnalyses ?? [],
    integrationStatuses,
    marketSignals: marketSignals.data
  };
}

function mergeAnalysis(
  payload: FinancialTwinPayload,
  analysis: FinancialTwinPayload["documentAnalyses"][number]
): FinancialTwinPayload {
  const now = new Date().toISOString();

  if (analysis.status !== "completed") {
    return {
      ...payload,
      documentAnalyses: [analysis, ...payload.documentAnalyses].slice(0, 10),
      auditLog: [
        {
          actor: "system",
          action: "DOCUMENT_ANALYSIS_SKIPPED",
          payloadHash: `sha256:${analysis.analysisId.slice(-12)}`,
          outcome: analysis.status,
          timestamp: now,
          signature: "openai-doc-analysis"
        },
        ...payload.auditLog
      ]
    };
  }

  const financialTwin = mergeFinancialTwin(payload.financialTwin, analysis.suggestedTwinPatch, now);
  const taxProfile = mergeTaxProfile(payload.taxProfile, analysis.suggestedTaxProfilePatch, financialTwin);

  return {
    ...payload,
    hasTwin: true,
    financialTwin,
    taxProfile,
    lifeEvents: appendUnique(payload.lifeEvents, analysis.suggestedLifeEvents, (event) => `${event.eventType}:${event.effectiveDate}`),
    strategyModules: appendUnique(
      payload.strategyModules,
      analysis.suggestedStrategyModules,
      (module) => module.moduleId
    ),
    documentAnalyses: [analysis, ...payload.documentAnalyses].slice(0, 10),
    auditLog: [
      {
        actor: "system",
        action: "DOCUMENT_ANALYZED",
        payloadHash: `sha256:${analysis.analysisId.slice(-12)}`,
        outcome: analysis.status,
        timestamp: now,
        signature: "openai-doc-analysis"
      },
      ...payload.auditLog
    ]
  };
}

function mergeFinancialTwin(
  existing: FinancialTwin | null,
  patch: Partial<FinancialTwin>,
  now: string
): FinancialTwin {
  return {
    household: patch.household ?? existing?.household ?? "Imported Household",
    advisor: patch.advisor ?? existing?.advisor ?? "Unassigned advisor",
    riskProfile: patch.riskProfile ?? existing?.riskProfile ?? "Balanced Growth",
    timeHorizon: patch.timeHorizon ?? existing?.timeHorizon ?? "Document-derived",
    contingencyReserve: patch.contingencyReserve ?? existing?.contingencyReserve ?? 0,
    taxEfficiencyScore: patch.taxEfficiencyScore ?? existing?.taxEfficiencyScore ?? 0,
    privacyMode: "Local-first",
    twinId: existing?.twinId ?? `twin_${crypto.randomUUID()}`,
    currentLifeNode: patch.currentLifeNode ?? existing?.currentLifeNode ?? "Document Review",
    stateOfResidence: patch.stateOfResidence ?? existing?.stateOfResidence ?? "Not set",
    filingStatus: patch.filingStatus ?? existing?.filingStatus ?? "Not set",
    lastEvaluatedAt: now
  };
}

function mergeTaxProfile(
  existing: TaxProfile | null,
  patch: Partial<TaxProfile>,
  financialTwin: FinancialTwin
): TaxProfile {
  return {
    filingStatus: patch.filingStatus ?? existing?.filingStatus ?? financialTwin.filingStatus,
    state: patch.state ?? existing?.state ?? financialTwin.stateOfResidence,
    dependents: patch.dependents ?? existing?.dependents ?? 0,
    priorYearAgiToken: patch.priorYearAgiToken ?? existing?.priorYearAgiToken ?? "[NOT_PROVIDED]",
    carryforwardLossesToken:
      patch.carryforwardLossesToken ?? existing?.carryforwardLossesToken ?? "[NOT_PROVIDED]",
    amtStatus: patch.amtStatus ?? existing?.amtStatus ?? "not-exposed",
    qbiEligibility: patch.qbiEligibility ?? existing?.qbiEligibility ?? "unknown"
  };
}

function appendUnique<T>(existing: T[], next: T[], key: (item: T) => string) {
  const seen = new Set(existing.map(key));
  const merged = [...existing];

  for (const item of next) {
    const id = key(item);

    if (!seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  }

  return merged;
}
