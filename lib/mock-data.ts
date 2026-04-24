import type {
  AgenticIntent,
  ApiSurface,
  AuditLogEntry,
  ConsentRecord,
  FinancialTwin,
  LifeEvent,
  LifecycleNode,
  MarketSignal,
  PrivacyBoundary,
  PrivacyThreat,
  ScenarioProjection,
  StrategyModule,
  TaxProfile
} from "./types";

export const defaultFinancialTwin: FinancialTwin = {
  household: "Patel Family Twin",
  advisor: "Maya Srinivasan, CFP",
  riskProfile: "Balanced Growth",
  timeHorizon: "Birth to legacy",
  contingencyReserve: 5.2,
  taxEfficiencyScore: 78,
  privacyMode: "Local-first",
  twinId: "twin_demo_7f41",
  currentLifeNode: "High Earner / Family Formation",
  stateOfResidence: "CA",
  filingStatus: "Married filing jointly",
  lastEvaluatedAt: "2026-04-24T19:45:00.000Z"
};

export const defaultTaxProfile: TaxProfile = {
  filingStatus: "Married filing jointly",
  state: "CA",
  dependents: 1,
  priorYearAgiToken: "[INCOME_TIER_HIGH_EARNER_FED_BRACKET_32]",
  carryforwardLossesToken: "[CAPITAL_LOSS_CARRYFORWARD_PRESENT_LOW]",
  amtStatus: "watching",
  qbiEligibility: "unknown"
};

export const defaultConsentRecords: ConsentRecord[] = [
  {
    scope: "READ_BROKERAGE",
    status: "granted",
    grantedAt: "2026-04-20",
    expiresAt: "2027-04-20"
  },
  {
    scope: "READ_PAYROLL",
    status: "granted",
    grantedAt: "2026-04-20",
    expiresAt: "2027-04-20"
  },
  {
    scope: "EXECUTE_AGENTIC_ACTIONS",
    status: "expires-soon",
    grantedAt: "2026-04-20",
    expiresAt: "2026-05-20"
  }
];

export const defaultLifecycleNodes: LifecycleNode[] = [
  {
    id: "birth",
    title: "Birth",
    ageBand: "0-5",
    signal: "Dependent added event detected",
    module: "Custodial Roth + 529 + beneficiaries",
    status: "active",
    completion: 72
  },
  {
    id: "career-start",
    title: "Career Start",
    ageBand: "22-30",
    signal: "Equity comp and payroll ingestion ready",
    module: "RSU / ISO / ESPP optimization",
    status: "ready",
    completion: 58
  },
  {
    id: "high-earner",
    title: "High Earner",
    ageBand: "30-50",
    signal: "Federal bracket token crossed threshold",
    module: "Backdoor Roth + tax-loss harvesting",
    status: "active",
    completion: 81
  },
  {
    id: "family-formation",
    title: "Family Formation",
    ageBand: "28-48",
    signal: "Estate graph incomplete",
    module: "Trust, insurance, guardianship review",
    status: "watching",
    completion: 46
  },
  {
    id: "pre-retirement",
    title: "Pre-Retirement",
    ageBand: "55+",
    signal: "Roth ladder and IRMAA windows not open",
    module: "Drawdown sequencing",
    status: "locked",
    completion: 18
  },
  {
    id: "legacy",
    title: "Legacy",
    ageBand: "Beyond",
    signal: "Beneficiary audit missing digital assets",
    module: "Estate graph + digital succession",
    status: "watching",
    completion: 33
  }
];

export const defaultLifeEvents: LifeEvent[] = [
  {
    eventType: "DEPENDENT_ADDED",
    effectiveDate: "2026-02-14",
    payloadToken: "[DEPENDENT_ADDED_MINOR]",
    triggeredModules: ["Education Funding", "Estate Planning", "Insurance Adequacy"],
    userAcknowledgedAt: "2026-02-15",
    planned: true
  },
  {
    eventType: "JOB_CHANGE",
    effectiveDate: "2025-11-01",
    payloadToken: "[EQUITY_COMP_PACKAGE_RSU_ISO]",
    triggeredModules: ["Equity Compensation", "Tax Optimization"],
    userAcknowledgedAt: "2025-11-02",
    planned: true
  },
  {
    eventType: "PAYROLL_DEPOSIT_DRIFT",
    effectiveDate: "2026-04-01",
    payloadToken: "[CASH_FLOW_DELTA_POSITIVE]",
    triggeredModules: ["Cash Flow", "Investment Allocation"],
    userAcknowledgedAt: "2026-04-03",
    planned: false
  },
  {
    eventType: "ESTATE_REVIEW_REQUESTED",
    effectiveDate: "2026-04-21",
    payloadToken: "[ESTATE_DOC_STATUS_INCOMPLETE]",
    triggeredModules: ["Estate Planning", "Digital Asset Management"],
    userAcknowledgedAt: "2026-04-21",
    planned: false
  }
];

export const defaultStrategyModules: StrategyModule[] = [
  {
    moduleId: "tax-loss-harvesting",
    version: "2.1.0",
    title: "Tax-Loss Harvesting Sweep",
    trigger: "Taxable ETF drift detected",
    module: "Tax Optimization",
    status: "approved",
    owner: "System",
    impact: "Replacement ETF basket queued with wash-sale guard",
    tokens: ["[TAXABLE_DRIFT]", "[WASH_SALE_GUARD]"],
    reversibilityClass: "reversible",
    citation: "IRS Pub. 550",
    risk: "Wash-sale misclassification if outside brokerage activity is missing."
  },
  {
    moduleId: "backdoor-roth",
    version: "2.1.0",
    title: "Backdoor Roth Eligibility",
    trigger: "High earner bracket token with IRA contribution intent",
    module: "Retirement Account Strategy",
    status: "eligible",
    owner: "Advisor",
    impact: "Pro-rata rule check required before conversion",
    tokens: ["[INCOME_TIER_HIGH_EARNER]", "[IRA_BALANCE_UNKNOWN]"],
    reversibilityClass: "transactional",
    citation: "IRC Sections 408 and 408A",
    risk: "Traditional IRA basis and pre-tax balances can create unexpected tax."
  },
  {
    moduleId: "equity-comp",
    version: "2.1.0",
    title: "RSU / ISO Concentration Guard",
    trigger: "Job change event with equity compensation flagged",
    module: "Equity Compensation",
    status: "needs-review",
    owner: "Advisor",
    impact: "Sell-to-cover vs hold simulation prepared",
    tokens: ["[EQUITY_COMP_PACKAGE_RSU_ISO]", "[CONCENTRATION_RISK_MEDIUM]"],
    reversibilityClass: "transactional",
    citation: "IRS Pub. 525",
    risk: "AMT exposure depends on exact exercise dates and FMV history."
  },
  {
    moduleId: "education-funding",
    version: "2.1.0",
    title: "529 vs UTMA Education Funding",
    trigger: "Dependent added event",
    module: "Education Funding",
    status: "needs-review",
    owner: "Client",
    impact: "State deduction and financial aid comparison pending",
    tokens: ["[EDU_TIME_HORIZON_18_PLUS]", "[STATE_TAX_PROFILE_CA]"],
    reversibilityClass: "pre-fill",
    citation: "IRC Section 529",
    risk: "Non-qualified withdrawals can create tax and penalty drag."
  },
  {
    moduleId: "business-entity",
    version: "2.1.0",
    title: "LLC / S-Corp / QSBS Entity Analysis",
    trigger: "Business formation or side-income life event",
    module: "Business Entity Structuring",
    status: "suppressed",
    owner: "CPA",
    impact: "Hidden until business event is recorded",
    tokens: ["[BUSINESS_FORMED_ABSENT]", "[QBI_UNKNOWN]"],
    reversibilityClass: "transactional",
    citation: "IRC Sections 199A and 1202",
    risk: "Formation choices may be irreversible for QSBS timing."
  },
  {
    moduleId: "digital-assets",
    version: "2.1.0",
    title: "Digital Asset Inheritance Protocol",
    trigger: "Estate graph missing wallet succession",
    module: "Digital Asset Management",
    status: "blocked",
    owner: "Estate Attorney",
    impact: "Seed phrase inheritance workflow blocked pending legal packet",
    tokens: ["[DIGITAL_ASSET_WALLET_PRESENT]", "[SEED_SUCCESSION_MISSING]"],
    reversibilityClass: "pre-fill",
    citation: "IRS Notice 2014-21",
    risk: "Operational security failure can permanently compromise assets."
  }
];

export const defaultProjections: ScenarioProjection[] = [
  {
    name: "Bull",
    annualReturn: "8.7%",
    volatility: "11.8%",
    endingValue: "$4.82M",
    confidence: "Top quartile",
    allocation: "VTI 55 / VXUS 25 / BND 20"
  },
  {
    name: "Average",
    annualReturn: "5.9%",
    volatility: "9.4%",
    endingValue: "$3.18M",
    confidence: "Median path",
    allocation: "VTI 50 / VXUS 25 / BND 25"
  },
  {
    name: "Bear",
    annualReturn: "2.1%",
    volatility: "14.2%",
    endingValue: "$1.91M",
    confidence: "Stress case",
    allocation: "VTI 45 / VXUS 20 / BND 35"
  },
  {
    name: "Stagflation",
    annualReturn: "1.4%",
    volatility: "12.7%",
    endingValue: "$1.72M",
    confidence: "Inflation stress",
    allocation: "VTI 42 / VXUS 18 / BND 40"
  },
  {
    name: "Lost Decade",
    annualReturn: "0.6%",
    volatility: "10.1%",
    endingValue: "$1.51M",
    confidence: "Sequence risk",
    allocation: "VTI 40 / VXUS 20 / BND 40"
  }
];

export const defaultPrivacyBoundaries: PrivacyBoundary[] = [
  {
    label: "Encrypted FinancialGraph",
    local: "Aurora reference decrypted only inside privacy boundary",
    shared: "Never leaves boundary",
    state: "sealed"
  },
  {
    label: "Tokenization Vault",
    local: "PII to semantic-token map with session TTL",
    shared: "[INCOME_TIER_HIGH_EARNER], [CASH_FLOW_DELTA]",
    state: "tokenized"
  },
  {
    label: "LLM Detokenization",
    local: "Response mapped back to user facts inside boundary",
    shared: "Token-only prompt and public citations",
    state: "review"
  }
];

export const defaultPrivacyThreats: PrivacyThreat[] = [
  {
    adversary: "Curious LLM provider",
    defense: "Receives only coarse semantic tokens and public regulatory context.",
    residualRisk: "Token combinations must remain broad enough to resist re-identification."
  },
  {
    adversary: "Compromised orchestration layer",
    defense: "No KMS decrypt permission; can route requests but cannot read FinancialGraphs.",
    residualRisk: "Availability impact remains possible."
  },
  {
    adversary: "Prompt injection through web content",
    defense: "Tinyfish content is data, not instruction; actions require declared intent.",
    residualRisk: "Human approval UX must stay explicit and hard to rush."
  }
];

export const defaultAgenticIntents: AgenticIntent[] = [
  {
    intentId: "intent_529_prefill",
    target: "529 provider portal",
    actionType: "Pre-fill application",
    reversibilityClass: "pre-fill",
    approvalRequired: true,
    status: "approval-required"
  },
  {
    intentId: "intent_doc_retrieve",
    target: "Brokerage document center",
    actionType: "Retrieve tax document",
    reversibilityClass: "read-only",
    approvalRequired: false,
    status: "ready"
  },
  {
    intentId: "intent_beneficiary_update",
    target: "Retirement account portal",
    actionType: "Beneficiary change preparation",
    reversibilityClass: "transactional",
    approvalRequired: true,
    status: "blocked"
  }
];

export const defaultAuditLog: AuditLogEntry[] = [
  {
    actor: "system",
    action: "STRATEGY_EVALUATED",
    payloadHash: "sha256:8df2...a91c",
    outcome: "6 modules ranked",
    timestamp: "2026-04-24T19:42:11.000Z",
    signature: "kms:demo-signature-01"
  },
  {
    actor: "agent",
    action: "TOKENIZED_PROMPT_CREATED",
    payloadHash: "sha256:19ac...4420",
    outcome: "No raw figures emitted",
    timestamp: "2026-04-24T19:43:03.000Z",
    signature: "kms:demo-signature-02"
  },
  {
    actor: "user",
    action: "CONSENT_GRANTED",
    payloadHash: "sha256:77bb...902a",
    outcome: "READ_BROKERAGE active",
    timestamp: "2026-04-20T16:03:55.000Z",
    signature: "kms:demo-signature-03"
  }
];

export const defaultApiSurface: ApiSurface[] = [
  {
    group: "Identity & Onboarding",
    routes: ["/v1/auth/session", "/v1/twin/initialize", "/v1/consent/grant", "/v1/consent/revoke"]
  },
  {
    group: "State & Strategy",
    routes: ["/v1/twin/state", "/v1/events/lifeevent", "/v1/strategy/evaluate", "/v1/strategy/{module_id}/explain"]
  },
  {
    group: "Compute",
    routes: ["/v1/compute/montecarlo", "/v1/compute/job/{id}", "/v1/scenarios/compare"]
  },
  {
    group: "Agentic Execution",
    routes: ["/v1/agent/dispatch", "/v1/agent/{intent_id}/approve", "/v1/agent/{intent_id}/rollback"]
  },
  {
    group: "Data Portability",
    routes: ["/v1/export/full", "/v1/account/delete"]
  }
];

export const defaultMarketSignals: MarketSignal[] = [
  { symbol: "VTI", price: 312.14, changePercent: 0.42, source: "local" },
  { symbol: "VXUS", price: 69.37, changePercent: 0.18, source: "local" },
  { symbol: "BND", price: 73.22, changePercent: -0.09, source: "local" }
];
