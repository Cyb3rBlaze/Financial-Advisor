import { env, hasValue } from "@/lib/env";
import type { IntegrationResult } from "@/lib/types";

type VapiCall = {
  id?: string;
  status?: string;
};

export async function createAdvisorVoiceCall(): Promise<IntegrationResult<VapiCall>> {
  if (
    !hasValue(env.vapiApiKey) ||
    !hasValue(env.vapiPhoneNumberId) ||
    !hasValue(env.vapiAssistantId) ||
    !hasValue(env.vapiCustomerNumber)
  ) {
    return {
      state: "setup-required",
      detail: "Add VAPI_API_KEY, VAPI_PHONE_NUMBER_ID, VAPI_ASSISTANT_ID, and VAPI_CUSTOMER_NUMBER.",
      data: {}
    };
  }

  const response = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.vapiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      phoneNumberId: env.vapiPhoneNumberId,
      assistantId: env.vapiAssistantId,
      customer: {
        number: env.vapiCustomerNumber
      },
      metadata: {
        product: "ethos-ledger",
        purpose: "advisor-review"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Vapi returned ${response.status}`);
  }

  return {
    state: "connected",
    detail: "Advisor voice call created.",
    data: (await response.json()) as VapiCall
  };
}
