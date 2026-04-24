import { env, hasValue } from "@/lib/env";
import { redisStatus } from "@/lib/integrations/redis";
import type { IntegrationStatus } from "@/lib/types";

export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
  const redis = await redisStatus();

  return [
    redis,
    {
      name: "WunderGraph",
      state: hasValue(env.wunderGraphOperationsUrl) ? "configured" : "setup-required",
      detail: hasValue(env.wunderGraphOperationsUrl)
        ? "Trusted strategy operation endpoint is configured."
        : "Add WUNDERGRAPH_OPERATIONS_URL for operations orchestration."
    },
    {
      name: "Nexla",
      state: hasValue(env.nexlaAccessToken) && hasValue(env.nexlaMarketFlowId) ? "configured" : "setup-required",
      detail:
        hasValue(env.nexlaAccessToken) && hasValue(env.nexlaMarketFlowId)
          ? "Market data flow credentials are configured."
          : "Add NEXLA_ACCESS_TOKEN and NEXLA_MARKET_FLOW_ID for market ingestion."
    },
    {
      name: "Akash",
      state: hasValue(env.akashDeploymentApiUrl) ? "configured" : "fallback",
      detail: hasValue(env.akashDeploymentApiUrl)
        ? "External simulation endpoint is configured."
        : "Local Monte Carlo simulation is active until AKASH_DEPLOYMENT_API_URL is added."
    },
    {
      name: "Vapi",
      state:
        hasValue(env.vapiApiKey) && hasValue(env.vapiPhoneNumberId) && hasValue(env.vapiAssistantId)
          ? "configured"
          : "setup-required",
      detail:
        hasValue(env.vapiApiKey) && hasValue(env.vapiPhoneNumberId) && hasValue(env.vapiAssistantId)
          ? "Voice call credentials are configured."
          : "Add Vapi call credentials before starting advisor voice sessions."
    },
    {
      name: "Tinyfish",
      state: hasValue(env.tinyfishApiKey) ? "configured" : "setup-required",
      detail: hasValue(env.tinyfishApiKey)
        ? "Remote browser sessions and twin-backed web research (CDP) are available."
        : "Add TINYFISH_API_KEY for advisor browser sessions and optional web-backed plan research."
    },
    {
      name: "Chainguard",
      state: "configured",
      detail: "Dockerfile uses Chainguard Node images for hardened runtime builds."
    },
    {
      name: "AWS Bedrock",
      state: "setup-required",
      detail: "Add a Bedrock-backed semantic parsing service before external LLM calls."
    },
    {
      name: "Ghost",
      state: "setup-required",
      detail: "Configure the regulatory vector corpus endpoint for grounded citations."
    },
    {
      name: "KMS",
      state: hasValue(env.redisUrl) ? "configured" : "setup-required",
      detail: "Use cloud KMS per-user DEKs for the production tokenization vault."
    }
  ];
}
