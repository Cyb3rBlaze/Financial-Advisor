export const env = {
  redisUrl: process.env.REDIS_URL ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5.5",
  wunderGraphOperationsUrl: process.env.WUNDERGRAPH_OPERATIONS_URL ?? "",
  wunderGraphApiKey: process.env.WUNDERGRAPH_API_KEY ?? "",
  nexlaApiBaseUrl: process.env.NEXLA_API_BASE_URL ?? "https://dataops.nexla.io/nexla-api",
  nexlaAccessToken: process.env.NEXLA_ACCESS_TOKEN ?? "",
  nexlaMarketFlowId: process.env.NEXLA_MARKET_FLOW_ID ?? "",
  akashDeploymentApiUrl: process.env.AKASH_DEPLOYMENT_API_URL ?? "",
  akashApiKey: process.env.AKASH_API_KEY ?? "",
  vapiApiKey: process.env.VAPI_API_KEY ?? "",
  vapiPhoneNumberId: process.env.VAPI_PHONE_NUMBER_ID ?? "",
  vapiAssistantId: process.env.VAPI_ASSISTANT_ID ?? "",
  vapiCustomerNumber: process.env.VAPI_CUSTOMER_NUMBER ?? "",
  tinyfishApiKey: process.env.TINYFISH_API_KEY ?? "",
  /** Optional. If unset, Tinyfish starts the session at about:blank (see Browser API). */
  tinyfishActionUrl: process.env.TINYFISH_ACTION_URL ?? ""
};

export function hasValue(value: string) {
  return value.trim().length > 0 && value !== "replace_me";
}
