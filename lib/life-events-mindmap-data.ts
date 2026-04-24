export type LifeEventCategoryId = "positive" | "negative" | "neutral";

export type LifeEventMindNode = {
  id: string;
  title: string;
  checklist: string[];
};

export type LifeEventCategory = {
  id: LifeEventCategoryId;
  label: string;
  subtitle: string;
  tone: "positive" | "negative" | "neutral";
  events: LifeEventMindNode[];
};

export const LIFE_EVENTS_CENTER = {
  title: "Financial journey",
  subtitle: "Typical arcs across an American life — reference map, not personalized advice."
};

export const LIFE_EVENTS_CATEGORIES: LifeEventCategory[] = [
  {
    id: "positive",
    label: "Positive events",
    subtitle: "Growth, opportunity, and forward momentum",
    tone: "positive",
    events: [
      {
        id: "birth-dependent",
        title: "Birth / New Dependent",
        checklist: [
          "Custodial Roth IRA (if dependent has earned income)",
          "529 plan (state tax deduction optimization)",
          "UTMA/UGMA tradeoff analysis",
          "Beneficiary designation updates across all accounts",
          "Revocable Living Trust setup",
          "Term life insurance sizing (human capital method)",
          "Disability income protection",
          "Healthcare directives & guardianship designation"
        ]
      },
      {
        id: "education-funding",
        title: "Education Planning / Higher Education Funding",
        checklist: [
          "529 maxing (age-based index funds)",
          "Coverdell ESA",
          "House-hacking near university (rental + equity + depreciation)",
          "Financial aid impact modeling",
          "Education tax credits (AOTC, LLC)",
          "Hybrid 529 + UTMA approach"
        ]
      },
      {
        id: "career-grind",
        title: "Career Start / The Grind",
        checklist: [
          "401(k) match structure analysis",
          "RSU vesting schedule parsing",
          "Sell-to-cover vs. hold simulation",
          "Concentration risk thresholds",
          "10b5-1 plan structuring (covered employees)",
          "Boglehead three-fund baseline (VTSAX/VTI/BND)",
          "Student loan strategy (PSLF, IDR, refinance)",
          "HSA triple-tax optimization"
        ]
      },
      {
        id: "first-gen-wealth",
        title: "First-Generation Wealth / Ground Zero",
        checklist: [
          "Emergency fund (3–6 months, sized by zip code + dependents)",
          "401(k) match capture (free money first)",
          "High-deductible health plan + HSA",
          "Roth IRA",
          "Renters insurance",
          "Long-term disability coverage",
          "Suppress aggressive investing until foundation set",
          "Chronological roadmap, not menu"
        ]
      },
      {
        id: "marriage-family",
        title: "Marriage / Family Formation",
        checklist: [
          "Joint vs. separate filing analysis",
          "Combined beneficiary audit",
          "Spousal IRA contributions",
          "Life insurance re-sizing",
          "Estate plan integration",
          "Account titling strategy"
        ]
      },
      {
        id: "inheritance-windfall",
        title: "Inheritance / Windfall",
        checklist: [
          "90-day cooling-off (T-bills, no investing)",
          "Step-up in basis verification",
          "SECURE Act 10-year rule on inherited IRAs",
          "Estate tax filing check (federal + state)",
          "Deploy to emergency fund / debt / retirement / 529",
          "DCA into taxable over 6–12 months",
          "Estate attorney consult for >exemption inheritances"
        ]
      },
      {
        id: "home-purchase",
        title: "Home Purchase",
        checklist: [
          "Rent vs. buy with full carrying-cost model",
          "Down payment vs. invest tradeoff",
          "Mortgage refinance triggers",
          "HELOC optimization",
          "PMI elimination timing"
        ]
      },
      {
        id: "starting-business",
        title: "Starting a Business",
        checklist: [
          "Entity selection (LLC / S-Corp / C-Corp / Partnership)",
          "S-Corp election threshold (~$80K+ net income)",
          "QSBS engineering (C-Corp before value accrues)",
          "State of formation analysis",
          "Solo 401(k) / SEP-IRA / SIMPLE / DB plan selection",
          "Reasonable compensation analysis",
          "QBI deduction (Section 199A) optimization",
          "EIN, Form 2553 pre-fill"
        ]
      },
      {
        id: "fire-journey",
        title: "FIRE Journey",
        checklist: [
          "Variant selection (Lean / Coast / Barista / Fat)",
          "Target latent graph per variant",
          "Dynamic Safe Withdrawal Rate (CAPE-adjusted, not 4% static)",
          "Coast number + coast age tracking",
          "Barista FIRE part-time + benefits modeling",
          "Monthly Vapi delta updates",
          "Sensitivity analysis on corrections"
        ]
      },
      {
        id: "pre-retirement-drawdown",
        title: "Pre-Retirement / Drawdown",
        checklist: [
          "Roth conversion ladder (gap years before SS)",
          "Social Security claiming optimization (incl. spousal)",
          "Medicare / IRMAA bracket management",
          "Withdrawal sequencing (taxable → traditional → Roth)",
          "RMD planning",
          "Tax-aware rebalancing in drawdown"
        ]
      },
      {
        id: "selling-business",
        title: "Selling a Business / Liquidity Event",
        checklist: [
          "QSBS Section 1202 exclusion ($10M / 10x basis)",
          "QSBS stacking via non-grantor trusts",
          "Charitable Remainder Trust (CRT) for appreciated stock",
          "Opportunity Zone deployment (180-day window)",
          "Installment sale structures",
          "Pre-sale residency change to no-tax state",
          "Investment Policy Statement post-transaction",
          "Transition off AUM-fee advisors"
        ]
      },
      {
        id: "high-earner",
        title: "High Earner Transition",
        checklist: [
          "Backdoor Roth IRA",
          "Mega Backdoor Roth (if plan permits)",
          "Tax-loss harvesting",
          "Asset location optimization",
          "AMT planning",
          "QBI deduction",
          "Charitable bunching / DAF",
          "Flat-fee fiduciary vs. AUM cost analysis",
          "LLC formation for asset segregation",
          "Umbrella liability coverage sized to net worth"
        ]
      }
    ]
  },
  {
    id: "negative",
    label: "Negative events",
    subtitle: "Shocks, stressors, and protective responses",
    tone: "negative",
    events: [
      {
        id: "job-loss",
        title: "Job Loss / Severance",
        checklist: [
          "Severance tax timing (lump sum vs. continuation, cross calendar year)",
          "COBRA vs. ACA marketplace (preserve HSA eligibility)",
          "401(k) rollover decision (leave / IRA / new employer)",
          "NUA analysis for appreciated employer stock",
          "Unemployment insurance eligibility by state",
          "Spend-down sequencing (taxable before retirement)",
          "Roth contribution withdrawals as last-resort liquidity"
        ]
      },
      {
        id: "healthcare-disability",
        title: "Healthcare Event / Disability",
        checklist: [
          "SSDI eligibility & application",
          "Private LTD claim (own-occ vs. any-occ)",
          "ABLE account (disability onset before 26)",
          "HSA: pay out-of-pocket now, reimburse decades later",
          "Medical expense itemized deduction (>7.5% AGI)",
          "Roth conversion suppression in high-medical years",
          "IRMAA bracket management (Medicare cliff effects)",
          "Palliative / hospice / end-of-life planning"
        ]
      },
      {
        id: "divorce",
        title: "Divorce",
        checklist: [
          "Marital vs. separate property segregation",
          "QDRO drafting checklist (avoid 10% penalty)",
          "Filing status decision (joint final vs. MFS)",
          "Head-of-household qualification",
          "Dependency exemption allocation",
          "Long-term wealth modeling under proposed splits",
          "Beneficiary updates post-decree",
          "House vs. liquid assets equity check"
        ]
      },
      {
        id: "aging-parents",
        title: "Aging Parents / Eldercare",
        checklist: [
          "LTC insurance vs. hybrid life-LTC vs. self-fund",
          "Medicaid 5-year look-back planning",
          "Annual exclusion gifting (gift-tax exempt ≠ Medicaid exempt)",
          "Medicaid Asset Protection Trust (MAPT)",
          "Community Spouse Resource Allowance",
          "Filial responsibility law exposure by state",
          "Powers of attorney + HIPAA + healthcare directives",
          "VA Aid & Attendance for veteran parents"
        ]
      }
    ]
  },
  {
    id: "neutral",
    label: "Neutral / structural events",
    subtitle: "Ongoing architecture and legacy mechanics",
    tone: "neutral",
    events: [
      {
        id: "crypto-digital",
        title: "Crypto / Digital Assets",
        checklist: [
          "Lot-by-lot cost basis (FIFO/LIFO/HIFO/spec-ID)",
          "Cross-chain basis continuity",
          "Tax-loss harvesting (no wash-sale rule, currently)",
          "Staking income classification (ordinary at receipt FMV)",
          "DeFi income (LP, lending) classification",
          "Self-custody concentration warnings",
          "Qualified custodian / multisig above thresholds",
          "Seed phrase inheritance (Shamir, multisig, dead-man-switch)",
          "NFT illiquidity discounts in net worth"
        ]
      },
      {
        id: "estate-legacy",
        title: "Estate & Legacy",
        checklist: [
          "Beneficiary designation audit (all accounts)",
          "TOD/POD optimization",
          "Revocable vs. irrevocable trust evaluation",
          "Gift tax annual exclusion strategy",
          "Generation-skipping considerations",
          "Donor-advised fund",
          "Qualified Charitable Distributions (QCDs from IRAs)",
          "Appreciated stock donation",
          "Charitable Remainder Trust (high net worth)",
          "Digital asset inventory + succession",
          "Healthcare directives + POA",
          "Estate attorney handoff packet"
        ]
      }
    ]
  }
];
