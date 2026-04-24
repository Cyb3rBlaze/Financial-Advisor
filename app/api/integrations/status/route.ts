import { NextResponse } from "next/server";
import { getIntegrationStatuses } from "@/lib/integrations/status";

export const runtime = "nodejs";

export async function GET() {
  const integrationStatuses = await getIntegrationStatuses();
  return NextResponse.json({ integrationStatuses });
}
