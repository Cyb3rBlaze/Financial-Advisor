export type LifecycleStatus = "active" | "ready" | "watching" | "locked";
export type StrategyStatus = "approved" | "needs-review" | "blocked" | "eligible" | "suppressed";
export type IntegrationState = "connected" | "configured" | "setup-required" | "fallback" | "error";
export type ReversibilityClass = "read-only" | "pre-fill" | "reversible" | "transactional";

export type FinancialTwin = {
  household: string;
  advisor: string;
  riskProfile: "Boglehead" | "Balanced Growth" | "Aggressive Growth";
  timeHorizon: string;
  contingencyReserve: number;
  taxEfficiencyScore: number;
  privacyMode: "Local-first";
  twinId: string;
  currentLifeNode: string;
  stateOfResidence: string;
  filingStatus: string;
  lastEvaluatedAt: string;
};

export type TaxProfile = {
  filingStatus: string;
  state: string;
  dependents: number;
  priorYearAgiToken: string;
  carryforwardLossesToken: string;
  amtStatus: "not-exposed" | "watching" | "exposed";
  qbiEligibility: "eligible" | "ineligible" | "unknown";
};

export type ConsentRecord = {
  scope: string;
  status: "granted" | "expires-soon" | "revoked";
  grantedAt: string;
  expiresAt: string;
};

export type LifecycleNode = {
  id: string;
  title: string;
  ageBand: string;
  signal: string;
  module: string;
  status: LifecycleStatus;
  completion: number;
};

export type LifeEvent = {
  eventType: string;
  effectiveDate: string;
  payloadToken: string;
  triggeredModules: string[];
  userAcknowledgedAt: string;
  planned: boolean;
};

export type StrategyModule = {
  moduleId: string;
  version: string;
  title: string;
  trigger: string;
  module: string;
  status: StrategyStatus;
  owner: string;
  impact: string;
  tokens: string[];
  reversibilityClass: ReversibilityClass;
  citation: string;
  risk: string;
};

export type ScenarioProjection = {
  name: "Bull" | "Average" | "Bear" | "Stagflation" | "Lost Decade";
  annualReturn: string;
  volatility: string;
  endingValue: string;
  confidence: string;
  allocation: string;
};

export type PrivacyBoundary = {
  label: string;
  local: string;
  shared: string;
  state: "sealed" | "tokenized" | "review";
};

export type IntegrationStatus = {
  name:
    | "Redis"
    | "WunderGraph"
    | "Nexla"
    | "Akash"
    | "Vapi"
    | "Tinyfish"
    | "Chainguard"
    | "AWS Bedrock"
    | "Ghost"
    | "KMS";
  state: IntegrationState;
  detail: string;
};

/** Web-grounded plan ideas from POST /api/research/plans (educational; not advice). */
export type TwinResearchPlan = {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  /** URLs from Tinyfish browser search snippets when scraping succeeds; may be empty. */
  sourceUrls: string[];
  priority: "high" | "medium" | "low";
};

export type TwinResearchRunResult = {
  plans: TwinResearchPlan[];
  queriesExecuted: string[];
  /** True when Tinyfish + Playwright returned at least one scraped snippet. */
  webSearchEnabled: boolean;
  rawHitCount: number;
};

/** Parsed subset of Redis INFO memory — server RAM / policy, not OS page cache directly. */
export type RedisMemorySnapshot = {
  usedMemoryBytes: number;
  usedMemoryHuman: string;
  maxmemoryBytes: number | null;
  maxmemoryHuman: string | null;
  maxmemoryPolicy: string;
  memFragmentationRatio: number | null;
};

/** One row in the twin-scoped ZSET timeline (score = epoch ms). */
export type TwinTimelineEvent = {
  id: string;
  scoreMs: number;
  at: string;
  action: string;
  summary: string;
};

/** GET /api/redis/telemetry — time-ordered twin history + memory + short-TTL session touch. */
export type RedisTelemetryResponse = {
  redisAvailable: boolean;
  memory: RedisMemorySnapshot | null;
  timeline: TwinTimelineEvent[];
  timelineTotal: number;
  timelineCap: number;
  sessionFingerprint: { lastSeenIso: string; source: string } | null;
  sessionTtlSeconds: number;
};

export type PrivacyThreat = {
  adversary: string;
  defense: string;
  residualRisk: string;
};

export type AgenticIntent = {
  intentId: string;
  target: string;
  actionType: string;
  reversibilityClass: ReversibilityClass;
  approvalRequired: boolean;
  status: "queued" | "approval-required" | "ready" | "blocked";
};

export type AuditLogEntry = {
  actor: "user" | "system" | "agent";
  action: string;
  payloadHash: string;
  outcome: string;
  timestamp: string;
  signature: string;
};

export type ApiSurface = {
  group: string;
  routes: string[];
};

export type DocumentInsight = {
  label: string;
  value: string;
  confidence: "low" | "medium" | "high";
};

export type DocumentAnalysis = {
  analysisId: string;
  provider: "openai";
  model: string;
  status: "completed" | "setup-required" | "failed";
  fileNames: string[];
  generatedAt: string;
  summary: string;
  insights: DocumentInsight[];
  suggestedTwinPatch: Partial<FinancialTwin>;
  suggestedTaxProfilePatch: Partial<TaxProfile>;
  suggestedLifeEvents: LifeEvent[];
  suggestedStrategyModules: StrategyModule[];
  warnings: string[];
};

export type FinancialTwinPayload = {
  hasTwin: boolean;
  financialTwin: FinancialTwin | null;
  taxProfile: TaxProfile | null;
  consentRecords: ConsentRecord[];
  lifecycleNodes: LifecycleNode[];
  lifeEvents: LifeEvent[];
  strategyModules: StrategyModule[];
  projections: ScenarioProjection[];
  privacyBoundaries: PrivacyBoundary[];
  privacyThreats: PrivacyThreat[];
  agenticIntents: AgenticIntent[];
  auditLog: AuditLogEntry[];
  apiSurface: ApiSurface[];
  documentAnalyses: DocumentAnalysis[];
  integrationStatuses: IntegrationStatus[];
  marketSignals: MarketSignal[];
};

export type MarketSignal = {
  symbol: "VTI" | "VXUS" | "BND";
  price: number;
  changePercent: number;
  source: "nexla" | "local";
};

export type SimulationInput = {
  initialValue: number;
  annualContribution: number;
  years: number;
  allocation: {
    VTI: number;
    VXUS: number;
    BND: number;
  };
};

export type IntegrationResult<T> = {
  state: IntegrationState;
  detail: string;
  data: T;
};
