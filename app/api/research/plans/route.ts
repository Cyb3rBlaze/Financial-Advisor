import { NextResponse } from "next/server";
import { researchPlansForTwin } from "@/lib/integrations/twin-research-plans";
import type { FinancialTwin, IntegrationResult, TaxProfile, TwinResearchRunResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  let body: { financialTwin?: FinancialTwin; taxProfile?: TaxProfile | null };
  try {
    body = (await request.json()) as { financialTwin?: FinancialTwin; taxProfile?: TaxProfile | null };
  } catch {
    return NextResponse.json(
      { state: "error", detail: "Invalid JSON body.", data: emptyData() } satisfies IntegrationResult<TwinResearchRunResult>,
      { status: 400 }
    );
  }

  if (!body.financialTwin) {
    return NextResponse.json(
      {
        state: "setup-required",
        detail: "financialTwin is required in the request body.",
        data: emptyData()
      } satisfies IntegrationResult<TwinResearchRunResult>,
      { status: 400 }
    );
  }

  try {
    const data = await researchPlansForTwin({
      financialTwin: body.financialTwin,
      taxProfile: body.taxProfile ?? null
    });

    const detail = data.webSearchEnabled
      ? `Grounded ${data.plans.length} plan themes on ${data.rawHitCount} snippets from a Tinyfish browser (queries: ${data.queriesExecuted.length}). Educational only — not advice.`
      : `Generated ${data.plans.length} educational plan themes from the twin without usable Tinyfish web snippets. Configure TINYFISH_API_KEY and ensure DuckDuckGo HTML results load in the remote session.`;

    return NextResponse.json({
      state: "connected",
      detail,
      data
    } satisfies IntegrationResult<TwinResearchRunResult>);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed.";
    return NextResponse.json(
      { state: "error", detail: message, data: emptyData() } satisfies IntegrationResult<TwinResearchRunResult>,
      { status: 502 }
    );
  }
}

function emptyData(): TwinResearchRunResult {
  return { plans: [], queriesExecuted: [], webSearchEnabled: false, rawHitCount: 0 };
}
