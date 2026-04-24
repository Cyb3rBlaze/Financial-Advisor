import { NextResponse } from "next/server";
import { writeJson } from "@/lib/integrations/redis";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const approval = {
    strategyTitle: typeof body.strategyTitle === "string" ? body.strategyTitle : "Draft plan",
    approvedBy: typeof body.approvedBy === "string" ? body.approvedBy : "Advisor",
    approvedAt: new Date().toISOString(),
    status: "advisor-approved"
  };

  await writeJson(`ethos:approval:${approval.strategyTitle}`, approval);

  return NextResponse.json({
    state: "connected",
    detail: "Advisor approval recorded.",
    data: approval
  });
}
