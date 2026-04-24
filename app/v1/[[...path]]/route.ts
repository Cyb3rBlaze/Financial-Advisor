import { NextResponse } from "next/server";
import { defaultApiSurface } from "@/lib/mock-data";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const implementedBlueprintRoutes = new Set(defaultApiSurface.flatMap((group) => group.routes));

export async function GET(request: Request, context: RouteContext) {
  return handleV1Request(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleV1Request(request, context);
}

async function handleV1Request(request: Request, context: RouteContext) {
  const params = await context.params;
  const requestedPath = `/v1/${params.path?.join("/") ?? ""}`.replace(/\/$/, "");
  const normalizedPath = requestedPath === "/v1" ? "/v1/twin/state" : requestedPath;

  return NextResponse.json({
    state: implementedBlueprintRoutes.has(normalizedPath) ? "blueprint-ready" : "unmapped",
    method: request.method,
    path: normalizedPath,
    gateway: "WunderGraph",
    privacyBoundary: "No raw PII or exact financial figures accepted by this edge stub.",
    nextStep: "Attach the corresponding typed operation or microservice handler."
  });
}
