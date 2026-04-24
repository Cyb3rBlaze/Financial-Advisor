"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  DollarSign,
  FileCheck2,
  Gauge,
  Home,
  KeyRound,
  Landmark,
  Lock,
  Network,
  RefreshCw,
  Scale,
  Shield,
  TrendingUp,
  UserRound,
  Wallet
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type {
  AgenticIntent,
  ApiSurface,
  AuditLogEntry,
  DocumentAnalysis,
  ConsentRecord,
  FinancialTwinPayload,
  IntegrationResult,
  IntegrationStatus,
  LifeEvent,
  MarketSignal,
  PrivacyThreat,
  ScenarioProjection,
  StrategyModule,
  StrategyStatus
} from "@/lib/types";

type DashboardView = "household" | "lifecycle" | "strategies" | "simulations" | "privacy" | "actions";
type OnboardingFormValues = {
  household: string;
  advisor: string;
  riskProfile: "Boglehead" | "Balanced Growth" | "Aggressive Growth";
  currentLifeNode: string;
  stateOfResidence: string;
  filingStatus: string;
  contingencyReserve: number;
  taxEfficiencyScore: number;
  dependents: number;
};

const initialPayload: FinancialTwinPayload = {
  hasTwin: false,
  financialTwin: null,
  taxProfile: null,
  consentRecords: [],
  lifecycleNodes: [],
  lifeEvents: [],
  strategyModules: [],
  projections: [],
  privacyBoundaries: [],
  privacyThreats: [],
  agenticIntents: [],
  auditLog: [],
  apiSurface: [],
  documentAnalyses: [],
  integrationStatuses: [],
  marketSignals: []
};

const navigation: Array<{ label: string; icon: typeof Home; href: string; view: DashboardView }> = [
  { label: "Household", icon: Home, href: "/", view: "household" },
  { label: "Lifecycle Graph", icon: Network, href: "/lifecycle", view: "lifecycle" },
  { label: "Strategies", icon: ClipboardCheck, href: "/strategies", view: "strategies" },
  { label: "Simulations", icon: Activity, href: "/simulations", view: "simulations" },
  { label: "Privacy", icon: Shield, href: "/privacy", view: "privacy" },
  { label: "Actions", icon: FileCheck2, href: "/actions", view: "actions" }
];

const statusCopy: Record<StrategyStatus, string> = {
  approved: "Approved",
  "needs-review": "Needs review",
  blocked: "Blocked",
  eligible: "Eligible",
  suppressed: "Suppressed"
};

const lifecycleStatusCopy = {
  active: "Active",
  ready: "Ready",
  watching: "Watching",
  locked: "Locked"
};

export function EthosDashboard() {
  const pathname = usePathname();
  const currentView = getCurrentView(pathname);
  const currentPage = navigation.find((item) => item.view === currentView) ?? navigation[0];
  const [payload, setPayload] = useState<FinancialTwinPayload>(initialPayload);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [systemMessage, setSystemMessage] = useState("Backend adapters ready. Add credentials in .env to activate external providers.");

  const {
    financialTwin,
    taxProfile,
    consentRecords,
    lifecycleNodes,
    lifeEvents,
    privacyBoundaries,
    privacyThreats,
    agenticIntents,
    auditLog,
    apiSurface,
    documentAnalyses,
    integrationStatuses,
    marketSignals
  } = payload;
  const displayHousehold = financialTwin?.household ?? "Create Financial Twin";
  const displayPrivacyMode = financialTwin?.privacyMode ?? "Local-first";
  const [strategyModules, setStrategyModules] = useState<StrategyModule[]>(payload.strategyModules);
  const [projections, setProjections] = useState<ScenarioProjection[]>(payload.projections);

  useEffect(() => {
    let mounted = true;

    async function loadTwin() {
      try {
        const response = await fetch("/api/financial-twin");
        if (!response.ok) {
          throw new Error(`Financial twin API returned ${response.status}`);
        }
        const data = (await response.json()) as FinancialTwinPayload;
        if (mounted) {
          setPayload(data);
          setStrategyModules(data.strategyModules);
          setProjections(data.projections);
          setSystemMessage(
            data.hasTwin
              ? "Financial twin loaded from Redis-backed persistence."
              : "No Financial Twin found. Create one to replace the empty state."
          );
        }
      } catch (error) {
        if (mounted) {
          setSystemMessage(error instanceof Error ? error.message : "Unable to load backend data.");
        }
      }
    }

    loadTwin();

    return () => {
      mounted = false;
    };
  }, []);

  const reviewCounts = useMemo(
    () => ({
      approved: strategyModules.filter((module) => module.status === "approved").length,
      review: strategyModules.filter((module) => module.status === "needs-review").length,
      blocked: strategyModules.filter((module) => module.status === "blocked").length
    }),
    [strategyModules]
  );

  async function createTwin(values: OnboardingFormValues) {
    setBusyAction("Create Financial Twin");
    setSystemMessage("Creating Financial Twin...");

    try {
      const response = await fetch("/api/financial-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error(`Create twin failed with ${response.status}`);
      }

      const data = (await response.json()) as FinancialTwinPayload;
      setPayload(data);
      setStrategyModules(data.strategyModules);
      setProjections(data.projections);
      setSystemMessage("Financial Twin created and persisted to Redis.");
    } catch (error) {
      setSystemMessage(error instanceof Error ? error.message : "Unable to create Financial Twin.");
    } finally {
      setBusyAction(null);
    }
  }

  async function analyzeDocuments(formData: FormData) {
    setBusyAction("Analyze documents");
    setSystemMessage("Uploading and analyzing documents...");

    try {
      const response = await fetch("/api/documents/analyze", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as IntegrationResult<{
        analysis: DocumentAnalysis;
        payload: FinancialTwinPayload;
      }>;

      if (!response.ok) {
        throw new Error(result.detail);
      }

      setPayload(result.data.payload);
      setStrategyModules(result.data.payload.strategyModules);
      setProjections(result.data.payload.projections);
      setSystemMessage(result.detail);
    } catch (error) {
      setSystemMessage(error instanceof Error ? error.message : "Document analysis failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function runBackendAction<T>(
    action: string,
    endpoint: string,
    options?: RequestInit,
    onSuccess?: (result: IntegrationResult<T>) => void
  ) {
    setBusyAction(action);
    setSystemMessage(`${action} started...`);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
        ...options
      });
      const result = (await response.json()) as IntegrationResult<T>;

      if (!response.ok) {
        throw new Error(result.detail);
      }

      onSuccess?.(result);
      setSystemMessage(result.detail);
    } catch (error) {
      setSystemMessage(error instanceof Error ? error.message : `${action} failed.`);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-lockup">
          <div className="brand-mark">
            <Landmark aria-hidden="true" size={22} />
          </div>
          <div>
            <p className="eyebrow">Ethos Ledger</p>
            <h1>Advisor Cockpit</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`nav-item ${isActive ? "is-active" : ""}`}
                href={item.href}
                key={item.label}
                title={item.label}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <section className="sidebar-panel" aria-label="Privacy posture">
          <div className="panel-row">
            <Lock aria-hidden="true" size={18} />
            <span>{displayPrivacyMode}</span>
          </div>
          <p>Raw balances stay sealed. LLM-facing work receives anonymized strategy tokens only.</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentPage.label}</p>
            <h2>{displayHousehold}</h2>
          </div>
          <div className="topbar-actions" aria-label="Advisor controls">
            <button className="icon-button" title="Open client profile" type="button">
              <UserRound aria-hidden="true" size={18} />
            </button>
            <button
              className="primary-action"
              disabled={busyAction !== null || !financialTwin}
              onClick={() =>
                runBackendAction("Advisor approval", "/api/actions/approve", {
                  body: JSON.stringify({
                    strategyTitle: "Ethos Ledger draft plan",
                    approvedBy: financialTwin?.advisor ?? "Advisor"
                  })
                })
              }
              type="button"
            >
              <FileCheck2 aria-hidden="true" size={18} />
              Review draft plan
            </button>
          </div>
        </header>

        <section className="system-strip" aria-label="Backend status">
          <div>
            <p className="eyebrow">Integration Runtime</p>
            <strong>{systemMessage}</strong>
          </div>
          <div className="status-cluster">
            {integrationStatuses.map((status) => (
              <IntegrationBadge key={status.name} status={status} />
            ))}
          </div>
        </section>

        {currentView === "household" ? (
          financialTwin && taxProfile ? (
          <>
            <section className="summary-grid" aria-label="Household summary">
              <MetricCard icon={<Gauge aria-hidden="true" size={19} />} label="Risk posture" value={financialTwin.riskProfile} detail="Psychological profile" />
              <MetricCard icon={<Wallet aria-hidden="true" size={19} />} label="Reserve status" value={`${financialTwin.contingencyReserve} mo`} detail="Target range: 3-6 months" />
              <MetricCard icon={<Scale aria-hidden="true" size={19} />} label="Tax efficiency" value={`${financialTwin.taxEfficiencyScore}/100`} detail="W-2 to asset-backed score" />
              <MetricCard icon={<KeyRound aria-hidden="true" size={19} />} label="Advisor" value={financialTwin.advisor} detail="Fiduciary review owner" />
            </section>
            <section className="dashboard-grid household-grid" aria-label="Financial twin model">
              <article className="panel">
                <PanelHeader eyebrow="UserTwin" title="Root profile and current node" icon={<UserRound aria-hidden="true" size={20} />} />
                <div className="kv-grid">
                  <KeyValue label="Twin ID" value={financialTwin.twinId} />
                  <KeyValue label="Current life node" value={financialTwin.currentLifeNode} />
                  <KeyValue label="State" value={financialTwin.stateOfResidence} />
                  <KeyValue label="Filing status" value={financialTwin.filingStatus} />
                  <KeyValue label="Last evaluated" value={formatDateTime(financialTwin.lastEvaluatedAt)} />
                </div>
              </article>
              <article className="panel">
                <PanelHeader eyebrow="TaxProfile" title="Jurisdictional context" icon={<Scale aria-hidden="true" size={20} />} />
                <div className="kv-grid">
                  <KeyValue label="Dependents" value={`${taxProfile.dependents}`} />
                  <KeyValue label="Prior AGI token" value={taxProfile.priorYearAgiToken} />
                  <KeyValue label="Losses token" value={taxProfile.carryforwardLossesToken} />
                  <KeyValue label="AMT status" value={taxProfile.amtStatus} />
                  <KeyValue label="QBI" value={taxProfile.qbiEligibility} />
                </div>
              </article>
              <article className="panel panel-wide">
                <PanelHeader eyebrow="Consent Records" title="Granular permissions and fiduciary access" icon={<FileCheck2 aria-hidden="true" size={20} />} />
                <div className="compact-list">
                  {consentRecords.map((consent) => (
                    <CompactRow key={consent.scope} title={consent.scope} detail={`Granted ${consent.grantedAt} · Expires ${consent.expiresAt}`} status={consent.status} />
                  ))}
                </div>
              </article>
              <DocumentUploadPanel
                analyses={documentAnalyses}
                busy={busyAction !== null}
                onAnalyze={analyzeDocuments}
              />
            </section>
          </>
          ) : (
            <div className="empty-stack">
              <OnboardingPanel busy={busyAction !== null} onCreate={createTwin} />
              <DocumentUploadPanel
                analyses={documentAnalyses}
                busy={busyAction !== null}
                onAnalyze={analyzeDocuments}
              />
            </div>
          )
        ) : null}

        <section className="dashboard-grid page-grid">
          {!payload.hasTwin && currentView !== "household" ? (
            <EmptyWidget
              title="No Financial Twin yet"
              detail="Create a twin on the Household page before lifecycle events, strategies, simulations, privacy records, or agent actions appear."
            />
          ) : null}

          {payload.hasTwin && currentView === "lifecycle" ? (
            <article className="panel panel-large">
              <PanelHeader eyebrow="Lifecycle Graph" title="Strategy triggers by life node" icon={<Network aria-hidden="true" size={20} />} />
              <div className="lifecycle-track" aria-label="Lifecycle modules">
                {lifecycleNodes.map((node) => (
                  <section className={`life-node ${node.status}`} key={node.id}>
                    <div className="node-head">
                      <span className="node-age">{node.ageBand}</span>
                      <span className={`status-pill ${node.status}`}>{lifecycleStatusCopy[node.status]}</span>
                    </div>
                    <h3>{node.title}</h3>
                    <p>{node.signal}</p>
                    <div className="module-chip">
                      <ArrowUpRight aria-hidden="true" size={15} />
                      {node.module}
                    </div>
                    <div className="progress-track" aria-label={`${node.title} readiness`}>
                      <span style={{ width: `${node.completion}%` }} />
                    </div>
                  </section>
                ))}
              </div>
              <div className="subsection-header">
                <p className="eyebrow">LifeEvent Log</p>
                <h3>Deterministic transitions, not inference</h3>
              </div>
              <div className="event-grid">
                {lifeEvents.map((event) => (
                  <LifeEventCard key={`${event.eventType}-${event.effectiveDate}`} event={event} />
                ))}
              </div>
            </article>
          ) : null}

          {payload.hasTwin && currentView === "simulations" ? (
            <article className="panel scenario-panel">
              <PanelHeader eyebrow="Monte Carlo" title="10,000-path regime forecast" icon={<TrendingUp aria-hidden="true" size={20} />} />
              <div className="market-row" aria-label="Market signals">
                {marketSignals.map((signal) => (
                  <MarketSignalPill key={signal.symbol} signal={signal} />
                ))}
              </div>
              <div className="panel-actions">
                <button
                  className="secondary-action"
                  disabled={busyAction !== null}
                  onClick={() =>
                    runBackendAction<ScenarioProjection[]>("Monte Carlo simulation", "/api/simulations", undefined, (result) => {
                      setProjections(result.data);
                    })
                  }
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={17} />
                  Run simulation
                </button>
              </div>
              <div className="scenario-list scenario-grid">
                {projections.map((scenario) => (
                  <section className={`scenario-card ${scenario.name.toLowerCase()}`} key={scenario.name}>
                    <div className="scenario-topline">
                      <h3>{scenario.name}</h3>
                      <strong>{scenario.endingValue}</strong>
                    </div>
                    <div className="scenario-bars" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <dl>
                      <div>
                        <dt>Return</dt>
                        <dd>{scenario.annualReturn}</dd>
                      </div>
                      <div>
                        <dt>Volatility</dt>
                        <dd>{scenario.volatility}</dd>
                      </div>
                      <div>
                        <dt>Path</dt>
                        <dd>{scenario.confidence}</dd>
                      </div>
                    </dl>
                    <p>{scenario.allocation}</p>
                  </section>
                ))}
              </div>
            </article>
          ) : null}

          {payload.hasTwin && currentView === "strategies" ? (
            <article className="panel panel-large">
              <PanelHeader eyebrow="Strategy Queue" title="Draft recommendations awaiting fiduciary review" icon={<ClipboardCheck aria-hidden="true" size={20} />} />
              <div className="panel-actions">
                <button
                  className="secondary-action"
                  disabled={busyAction !== null}
                  onClick={() =>
                    runBackendAction<StrategyModule[]>(
                      "Strategy evaluation",
                      "/api/strategies/evaluate",
                      { body: JSON.stringify({ strategyModules }) },
                      (result) => {
                        setStrategyModules(result.data);
                      }
                    )
                  }
                  type="button"
                >
                  <Network aria-hidden="true" size={17} />
                  Evaluate modules
                </button>
              </div>
              <div className="strategy-list">
                {strategyModules.map((module) => (
                  <section className="strategy-row" key={module.title}>
                    <div className="strategy-status">
                      <StatusIcon status={module.status} />
                    </div>
                    <div className="strategy-main">
                      <div className="strategy-title-row">
                        <h3>{module.title}</h3>
                        <span className={`strategy-pill ${module.status}`}>{statusCopy[module.status]}</span>
                      </div>
                      <p>{module.trigger}</p>
                      <div className="token-row">
                        {module.tokens.map((token) => (
                          <span key={token}>{token}</span>
                        ))}
                      </div>
                      <p className="reasoning-copy">
                        {module.citation} · {module.risk}
                      </p>
                    </div>
                    <div className="strategy-meta">
                      <span>{module.moduleId}</span>
                      <strong>v{module.version}</strong>
                      <span>{module.module}</span>
                      <strong>{module.owner}</strong>
                      <span>{module.reversibilityClass}</span>
                      <p>{module.impact}</p>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ) : null}

          {payload.hasTwin && currentView === "privacy" ? (
            <article className="panel">
              <PanelHeader eyebrow="Privacy Boundary" title="Local facts vs. shared tokens" icon={<Shield aria-hidden="true" size={20} />} />
              <div className="privacy-list">
                {privacyBoundaries.map((boundary) => (
                  <section className="privacy-row" key={boundary.label}>
                    <div className={`privacy-state ${boundary.state}`}>
                      {boundary.state === "sealed" ? <Lock aria-hidden="true" size={16} /> : boundary.state === "tokenized" ? <Database aria-hidden="true" size={16} /> : <FileCheck2 aria-hidden="true" size={16} />}
                    </div>
                    <div>
                      <h3>{boundary.label}</h3>
                      <p>{boundary.local}</p>
                      <span>{boundary.shared}</span>
                    </div>
                  </section>
                ))}
              </div>
              <div className="subsection-header">
                <p className="eyebrow">Threat Model</p>
                <h3>What the boundary is designed to withstand</h3>
              </div>
              <div className="threat-grid">
                {privacyThreats.map((threat) => (
                  <ThreatCard key={threat.adversary} threat={threat} />
                ))}
              </div>
            </article>
          ) : null}

          {payload.hasTwin && currentView === "actions" ? (
            <article className="panel review-panel">
              <PanelHeader eyebrow="Advisor Actions" title="Review posture" icon={<FileCheck2 aria-hidden="true" size={20} />} />
              <div className="review-grid">
                <ReviewCount label="Approved" value={reviewCounts.approved} tone="approved" />
                <ReviewCount label="Needs review" value={reviewCounts.review} tone="review" />
                <ReviewCount label="Blocked" value={reviewCounts.blocked} tone="blocked" />
              </div>
              <div className="action-memo">
                <div>
                  <h3>Professional review required</h3>
                  <p>Draft strategies are planning artifacts for licensed advisor, CPA, and attorney validation. They are not financial, tax, or legal advice.</p>
                </div>
                <div className="action-buttons">
                  <button className="secondary-action" disabled={busyAction !== null} onClick={() => runBackendAction("Voice session", "/api/actions/voice")} type="button">
                    <Activity aria-hidden="true" size={17} />
                    Start voice review
                  </button>
                  <button className="secondary-action" disabled={busyAction !== null} onClick={() => runBackendAction("Browser action", "/api/actions/browser")} type="button">
                    <DollarSign aria-hidden="true" size={17} />
                    Open action session
                  </button>
                </div>
              </div>
              <div className="subsection-header">
                <p className="eyebrow">AgenticIntent Queue</p>
                <h3>Reversibility gates and approval state</h3>
              </div>
              <div className="intent-grid">
                {agenticIntents.map((intent) => (
                  <IntentCard key={intent.intentId} intent={intent} />
                ))}
              </div>
              <div className="subsection-header">
                <p className="eyebrow">Audit Ledger</p>
                <h3>Immutable records for books-and-records retention</h3>
              </div>
              <div className="audit-list">
                {auditLog.map((entry) => (
                  <AuditRow key={`${entry.action}-${entry.timestamp}`} entry={entry} />
                ))}
              </div>
              <div className="subsection-header">
                <p className="eyebrow">API Surface</p>
                <h3>WunderGraph-mediated v1 contract</h3>
              </div>
              <div className="api-grid">
                {apiSurface.map((group) => (
                  <ApiGroupCard key={group.group} group={group} />
                ))}
              </div>
            </article>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function getCurrentView(pathname: string): DashboardView {
  if (pathname.startsWith("/lifecycle")) return "lifecycle";
  if (pathname.startsWith("/strategies")) return "strategies";
  if (pathname.startsWith("/simulations")) return "simulations";
  if (pathname.startsWith("/privacy")) return "privacy";
  if (pathname.startsWith("/actions")) return "actions";
  return "household";
}

function OnboardingPanel({
  busy,
  onCreate
}: {
  busy: boolean;
  onCreate: (values: OnboardingFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<OnboardingFormValues>({
    household: "",
    advisor: "",
    riskProfile: "Balanced Growth",
    currentLifeNode: "",
    stateOfResidence: "",
    filingStatus: "",
    contingencyReserve: 0,
    taxEfficiencyScore: 0,
    dependents: 0
  });

  function updateText(name: keyof OnboardingFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  function updateNumber(name: keyof OnboardingFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [name]: Number(value)
    }));
  }

  return (
    <article className="panel onboarding-panel">
      <PanelHeader eyebrow="First Run" title="Create a Financial Twin" icon={<UserRound aria-hidden="true" size={20} />} />
      <p className="empty-copy">
        No household data is loaded. Enter local onboarding details to create the first Redis-backed twin.
      </p>
      <form
        className="onboarding-form"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(values);
        }}
      >
        <label>
          Household name
          <input
            required
            value={values.household}
            onChange={(event) => updateText("household", event.target.value)}
            placeholder="Household name"
          />
        </label>
        <label>
          Advisor
          <input
            value={values.advisor}
            onChange={(event) => updateText("advisor", event.target.value)}
            placeholder="Advisor name"
          />
        </label>
        <label>
          Risk profile
          <select
            value={values.riskProfile}
            onChange={(event) =>
              updateText(
                "riskProfile",
                event.target.value as OnboardingFormValues["riskProfile"]
              )
            }
          >
            <option>Boglehead</option>
            <option>Balanced Growth</option>
            <option>Aggressive Growth</option>
          </select>
        </label>
        <label>
          Current life node
          <input
            value={values.currentLifeNode}
            onChange={(event) => updateText("currentLifeNode", event.target.value)}
            placeholder="Current node"
          />
        </label>
        <label>
          State of residence
          <input
            value={values.stateOfResidence}
            onChange={(event) => updateText("stateOfResidence", event.target.value)}
            placeholder="State"
          />
        </label>
        <label>
          Filing status
          <input
            value={values.filingStatus}
            onChange={(event) => updateText("filingStatus", event.target.value)}
            placeholder="Filing status"
          />
        </label>
        <label>
          Reserve months
          <input
            min="0"
            max="60"
            step="0.1"
            type="number"
            value={values.contingencyReserve}
            onChange={(event) => updateNumber("contingencyReserve", event.target.value)}
          />
        </label>
        <label>
          Tax efficiency score
          <input
            min="0"
            max="100"
            type="number"
            value={values.taxEfficiencyScore}
            onChange={(event) => updateNumber("taxEfficiencyScore", event.target.value)}
          />
        </label>
        <label>
          Dependents
          <input
            min="0"
            max="20"
            type="number"
            value={values.dependents}
            onChange={(event) => updateNumber("dependents", event.target.value)}
          />
        </label>
        <button className="primary-action" disabled={busy} type="submit">
          <FileCheck2 aria-hidden="true" size={18} />
          Create twin
        </button>
      </form>
    </article>
  );
}

function DocumentUploadPanel({
  analyses,
  busy,
  onAnalyze
}: {
  analyses: DocumentAnalysis[];
  busy: boolean;
  onAnalyze: (formData: FormData) => Promise<void>;
}) {
  const [consented, setConsented] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  return (
    <article className="panel document-panel panel-wide">
      <PanelHeader eyebrow="Document Intelligence" title="Upload documents to refine the twin" icon={<Database aria-hidden="true" size={20} />} />
      <p className="empty-copy">
        Upload PDF, CSV, JSON, TXT, MD, or XML files. Raw text is extracted server-side and sent to OpenAI only after explicit consent. The app stores structured analysis, not raw document text.
      </p>
      <form
        className="document-form"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData();

          for (const file of selectedFiles) {
            formData.append("documents", file);
          }

          formData.append("consent", consented ? "true" : "false");
          onAnalyze(formData);
        }}
      >
        <label className="file-picker">
          Documents
          <input
            multiple
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.xml,application/pdf,text/plain,text/csv,application/json"
            onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
          />
        </label>
        <label className="consent-row">
          <input
            checked={consented}
            type="checkbox"
            onChange={(event) => setConsented(event.target.checked)}
          />
          I consent to sending extracted document text to OpenAI for structured analysis.
        </label>
        <button className="primary-action" disabled={busy || !consented || selectedFiles.length === 0} type="submit">
          <RefreshCw aria-hidden="true" size={18} />
          Analyze documents
        </button>
      </form>
      {selectedFiles.length > 0 ? (
        <div className="token-row document-files">
          {selectedFiles.map((file) => (
            <span key={`${file.name}-${file.size}`}>{file.name}</span>
          ))}
        </div>
      ) : null}
      {analyses.length > 0 ? (
        <>
          <div className="subsection-header">
            <p className="eyebrow">Analysis History</p>
            <h3>Structured outputs applied to this twin</h3>
          </div>
          <div className="analysis-list">
            {analyses.map((analysis) => (
              <DocumentAnalysisCard analysis={analysis} key={analysis.analysisId} />
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}

function DocumentAnalysisCard({ analysis }: { analysis: DocumentAnalysis }) {
  return (
    <section className="analysis-card">
      <div className="node-head">
        <span className="node-age">{analysis.model}</span>
        <span className={`status-pill ${analysis.status === "completed" ? "active" : "watching"}`}>
          {analysis.status}
        </span>
      </div>
      <h3>{analysis.fileNames.join(", ")}</h3>
      <p>{analysis.summary}</p>
      <div className="token-row">
        {analysis.insights.slice(0, 6).map((insight) => (
          <span key={`${analysis.analysisId}-${insight.label}`}>
            {insight.label}: {insight.value}
          </span>
        ))}
      </div>
      {analysis.warnings.length > 0 ? <p className="reasoning-copy">{analysis.warnings.join(" ")}</p> : null}
    </section>
  );
}

function EmptyWidget({ detail, title }: { detail: string; title: string }) {
  return (
    <article className="panel empty-widget">
      <PanelHeader eyebrow="Empty State" title={title} icon={<Database aria-hidden="true" size={20} />} />
      <p className="empty-copy">{detail}</p>
      <Link className="secondary-action empty-link" href="/">
        <Home aria-hidden="true" size={17} />
        Go to Household
      </Link>
    </article>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="kv-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompactRow({ detail, status, title }: { detail: string; status: string; title: string }) {
  return (
    <section className="compact-row">
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <span className={`strategy-pill ${status}`}>{status}</span>
    </section>
  );
}

function LifeEventCard({ event }: { event: LifeEvent }) {
  return (
    <section className="event-card">
      <div className="node-head">
        <span className="node-age">{event.effectiveDate}</span>
        <span className={`status-pill ${event.planned ? "ready" : "watching"}`}>
          {event.planned ? "Planned" : "Unplanned"}
        </span>
      </div>
      <h3>{event.eventType}</h3>
      <p>{event.payloadToken}</p>
      <div className="token-row">
        {event.triggeredModules.map((module) => (
          <span key={module}>{module}</span>
        ))}
      </div>
    </section>
  );
}

function ThreatCard({ threat }: { threat: PrivacyThreat }) {
  return (
    <section className="threat-card">
      <h3>{threat.adversary}</h3>
      <p>{threat.defense}</p>
      <span>{threat.residualRisk}</span>
    </section>
  );
}

function IntentCard({ intent }: { intent: AgenticIntent }) {
  return (
    <section className="intent-card">
      <div className="node-head">
        <span className="node-age">{intent.intentId}</span>
        <span className={`status-pill ${intent.status === "ready" ? "active" : intent.status === "blocked" ? "locked" : "watching"}`}>
          {intent.status}
        </span>
      </div>
      <h3>{intent.actionType}</h3>
      <p>{intent.target}</p>
      <div className="module-chip">
        <ArrowUpRight aria-hidden="true" size={15} />
        {intent.reversibilityClass}
      </div>
      <p className="reasoning-copy">{intent.approvalRequired ? "Human approval required" : "Read-only autonomous action allowed"}</p>
    </section>
  );
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <section className="audit-row">
      <div>
        <h3>{entry.action}</h3>
        <p>
          {entry.actor} · {formatDateTime(entry.timestamp)}
        </p>
      </div>
      <div>
        <span>{entry.payloadHash}</span>
        <strong>{entry.outcome}</strong>
        <p>{entry.signature}</p>
      </div>
    </section>
  );
}

function ApiGroupCard({ group }: { group: ApiSurface }) {
  return (
    <section className="api-card">
      <h3>{group.group}</h3>
      <div className="token-row">
        {group.routes.map((route) => (
          <span key={route}>{route}</span>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ detail, icon, label, value }: { detail: string; icon: ReactNode; label: string; value: string }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function PanelHeader({ eyebrow, icon, title }: { eyebrow: string; icon: ReactNode; title: string }) {
  return (
    <header className="panel-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <div className="panel-icon">{icon}</div>
    </header>
  );
}

function StatusIcon({ status }: { status: StrategyStatus }) {
  if (status === "approved") {
    return <CheckCircle2 aria-label="Approved" className="approved-icon" size={21} />;
  }

  if (status === "blocked") {
    return <AlertTriangle aria-label="Blocked" className="blocked-icon" size={21} />;
  }

  return <Clock3 aria-label="Needs review" className="review-icon" size={21} />;
}

function ReviewCount({ label, tone, value }: { label: string; tone: "approved" | "review" | "blocked"; value: number }) {
  return (
    <section className={`review-count ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function IntegrationBadge({ status }: { status: IntegrationStatus }) {
  return (
    <span className={`integration-badge ${status.state}`} title={status.detail}>
      {status.name}
    </span>
  );
}

function MarketSignalPill({ signal }: { signal: MarketSignal }) {
  const direction = signal.changePercent >= 0 ? "up" : "down";

  return (
    <span className={`market-pill ${direction}`} title={`${signal.source} data`}>
      {signal.symbol} ${signal.price.toFixed(2)} {signal.changePercent >= 0 ? "+" : ""}
      {signal.changePercent.toFixed(2)}%
    </span>
  );
}
