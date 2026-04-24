import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { env, hasValue } from "@/lib/env";
import type { DocumentAnalysis, FinancialTwinPayload } from "@/lib/types";
import type { ExtractedDocument } from "@/lib/documents/extract";

const DocumentInsightSchema = z.object({
  label: z.string(),
  value: z.string(),
  confidence: z.enum(["low", "medium", "high"])
});

const LifeEventSchema = z.object({
  eventType: z.string(),
  effectiveDate: z.string(),
  payloadToken: z.string(),
  triggeredModules: z.array(z.string()),
  userAcknowledgedAt: z.string(),
  planned: z.boolean()
});

const StrategyModuleSchema = z.object({
  moduleId: z.string(),
  version: z.string(),
  title: z.string(),
  trigger: z.string(),
  module: z.string(),
  status: z.enum(["approved", "needs-review", "blocked", "eligible", "suppressed"]),
  owner: z.string(),
  impact: z.string(),
  tokens: z.array(z.string()),
  reversibilityClass: z.enum(["read-only", "pre-fill", "reversible", "transactional"]),
  citation: z.string(),
  risk: z.string()
});

const FinancialTwinPatchSchema = z.object({
  household: z.string().nullish(),
  advisor: z.string().nullish(),
  riskProfile: z.enum(["Boglehead", "Balanced Growth", "Aggressive Growth"]).nullish(),
  timeHorizon: z.string().nullish(),
  contingencyReserve: z.number().nullish(),
  taxEfficiencyScore: z.number().nullish(),
  currentLifeNode: z.string().nullish(),
  stateOfResidence: z.string().nullish(),
  filingStatus: z.string().nullish()
});

const TaxProfilePatchSchema = z.object({
  filingStatus: z.string().nullish(),
  state: z.string().nullish(),
  dependents: z.number().nullish(),
  priorYearAgiToken: z.string().nullish(),
  carryforwardLossesToken: z.string().nullish(),
  amtStatus: z.enum(["not-exposed", "watching", "exposed"]).nullish(),
  qbiEligibility: z.enum(["eligible", "ineligible", "unknown"]).nullish()
});

const DocumentAnalysisSchema = z.object({
  summary: z.string(),
  insights: z.array(DocumentInsightSchema),
  suggestedTwinPatch: FinancialTwinPatchSchema,
  suggestedTaxProfilePatch: TaxProfilePatchSchema,
  suggestedLifeEvents: z.array(LifeEventSchema),
  suggestedStrategyModules: z.array(StrategyModuleSchema),
  warnings: z.array(z.string())
});

export async function analyzeDocumentsWithOpenAI({
  documents,
  currentPayload
}: {
  documents: ExtractedDocument[];
  currentPayload: FinancialTwinPayload;
}): Promise<DocumentAnalysis> {
  const generatedAt = new Date().toISOString();

  if (!hasValue(env.openaiApiKey)) {
    return {
      analysisId: `analysis_${crypto.randomUUID()}`,
      provider: "openai",
      model: env.openaiModel,
      status: "setup-required",
      fileNames: documents.map((document) => document.name),
      generatedAt,
      summary: "OpenAI analysis is not configured. Add OPENAI_API_KEY to .env.",
      insights: [],
      suggestedTwinPatch: {},
      suggestedTaxProfilePatch: {},
      suggestedLifeEvents: [],
      suggestedStrategyModules: [],
      warnings: ["Document text was extracted locally, but no model call was made."]
    };
  }

  const client = new OpenAI({ apiKey: env.openaiApiKey });
  const response = await client.responses.parse({
    model: env.openaiModel,
    reasoning: { effort: "low" },
    input: [
      {
        role: "system",
        content:
          "You extract financial planning facts from user-uploaded documents for Ethos Ledger. Return only schema-valid structured data. Do not provide financial, tax, legal, or investment advice. Use semantic tokens instead of exact dollar amounts where possible. If a field is not supported by the evidence, omit it or return a warning."
      },
      {
        role: "user",
        content: JSON.stringify({
          currentTwin: {
            hasTwin: currentPayload.hasTwin,
            financialTwin: currentPayload.financialTwin,
            taxProfile: currentPayload.taxProfile
          },
          documents: documents.map((document) => ({
            name: document.name,
            type: document.type,
            size: document.size,
            extractedText: document.text
          }))
        })
      }
    ],
    text: {
      format: zodTextFormat(DocumentAnalysisSchema, "financial_document_analysis")
    }
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("OpenAI returned no structured document analysis.");
  }

  return {
    analysisId: `analysis_${crypto.randomUUID()}`,
    provider: "openai",
    model: env.openaiModel,
    status: "completed",
    fileNames: documents.map((document) => document.name),
    generatedAt,
    ...parsed
  };
}
