import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { env, hasValue } from "@/lib/env";
import { createActionBrowserSession } from "@/lib/integrations/tinyfish";
import { scrapeWebViaTinyfishCdp } from "@/lib/integrations/tinyfish-web-search";
import type { FinancialTwin, TaxProfile, TwinResearchPlan, TwinResearchRunResult } from "@/lib/types";

const TwinResearchPlansSchema = z.object({
  plans: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      rationale: z.string(),
      sourceUrls: z.array(z.string()),
      priority: z.enum(["high", "medium", "low"])
    })
  )
});

export function buildResearchQueries(twin: FinancialTwin, tax: TaxProfile | null): string[] {
  const state = twin.stateOfResidence.trim() || "United States";
  const life = twin.currentLifeNode.trim() || "working age";
  const filing = twin.filingStatus.trim() || "W-2 household";
  const risk = twin.riskProfile;
  const reserve = twin.contingencyReserve;
  const deps = tax?.dependents ?? 0;

  return [
    `${state} ${filing} retirement tax planning ${risk} investor checklist`,
    `${life} financial planning priorities emergency fund ${reserve} months expenses`,
    `${risk} index fund allocation glide path ${deps} dependents`,
    `HSA Roth IRA contribution ordering high deductible plan ${state}`
  ];
}

export async function researchPlansForTwin({
  financialTwin,
  taxProfile
}: {
  financialTwin: FinancialTwin;
  taxProfile: TaxProfile | null;
}): Promise<TwinResearchRunResult> {
  if (!hasValue(env.openaiApiKey)) {
    throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to synthesize plan ideas.");
  }

  const queriesExecuted = buildResearchQueries(financialTwin, taxProfile);
  let webSearchEnabled = false;
  let hits: Awaited<ReturnType<typeof scrapeWebViaTinyfishCdp>> = [];

  if (hasValue(env.tinyfishApiKey)) {
    try {
      const session = await createActionBrowserSession();
      const cdp = session.state === "connected" ? session.data.cdp_url : undefined;
      if (typeof cdp === "string" && cdp.length > 0) {
        hits = await scrapeWebViaTinyfishCdp(cdp, queriesExecuted, 4, 14);
        webSearchEnabled = hits.length > 0;
      }
    } catch {
      webSearchEnabled = false;
      hits = [];
    }
  }

  const searchDigest =
    hits.length > 0
      ? hits.map((h, i) => `[${i + 1}] ${h.title}\nURL: ${h.url}\n${h.content}`).join("\n\n---\n\n")
      : "(No live web snippets — Tinyfish browser search unavailable or returned no parseable results. Still derive conservative, general planning themes only.)";

  const client = new OpenAI({ apiKey: env.openaiApiKey });

  const response = await client.responses.parse({
    model: env.openaiModel,
    reasoning: { effort: "low" },
    input: [
      {
        role: "system",
        content:
          "You assist Ethos Ledger with research scaffolding. Output schema-valid JSON only. Produce 4–7 educational planning *topics* (not personalized financial, tax, legal, or investment advice). Each plan must include a short summary and rationale tied to the digital twin context. When web snippets are provided (from a real browser session), ground rationale in them and set sourceUrls to a subset of those URLs you actually relied on (1–3 per plan). When no snippets, leave sourceUrls empty. Never invent URLs."
      },
      {
        role: "user",
        content: JSON.stringify({
          financialTwin,
          taxProfile,
          queriesExecuted,
          webSearchEnabled,
          webSnippets: hits.map((h) => ({ title: h.title, url: h.url, excerpt: h.content }))
        })
      },
      {
        role: "user",
        content: `Condensed web digest for grounding:\n${searchDigest}`
      }
    ],
    text: {
      format: zodTextFormat(TwinResearchPlansSchema, "twin_research_plans")
    }
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new Error("OpenAI returned no structured research plans.");
  }

  const plans: TwinResearchPlan[] = parsed.plans.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary,
    rationale: p.rationale,
    sourceUrls: p.sourceUrls,
    priority: p.priority
  }));

  return {
    plans,
    queriesExecuted,
    webSearchEnabled,
    rawHitCount: hits.length
  };
}
