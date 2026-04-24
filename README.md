# Ethos Ledger

Private wealth advisor cockpit built with Next.js, typed local fallbacks, and credential-driven backend adapters.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Credentials

Fill `.env` with the credentials for the providers you want to activate. The app remains usable without credentials:

- `REDIS_URL`: persists financial twin state and advisor actions.
- `OPENAI_API_KEY`, `OPENAI_MODEL`: analyzes uploaded documents with the OpenAI Responses API and Structured Outputs.
- `WUNDERGRAPH_OPERATIONS_URL`, `WUNDERGRAPH_API_KEY`: sends anonymized strategy intents to a trusted operations gateway.
- `NEXLA_ACCESS_TOKEN`, `NEXLA_MARKET_FLOW_ID`: checks the configured market data flow.
- `AKASH_DEPLOYMENT_API_URL`, `AKASH_API_KEY`: runs Monte Carlo jobs on an external Akash-backed endpoint; local simulation is used until configured.
- `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `VAPI_ASSISTANT_ID`, `VAPI_CUSTOMER_NUMBER`: creates advisor voice review calls.
- `TINYFISH_API_KEY`: creates isolated browser sessions via Tinyfish Browser API. `TINYFISH_ACTION_URL` is optional (initial page inside the remote browser; omit for `about:blank`).

## Backend Routes

- `GET /api/financial-twin`
- `GET /api/integrations/status`
- `POST /api/simulations`
- `POST /api/strategies/evaluate`
- `POST /api/actions/approve`
- `POST /api/actions/voice`
- `POST /api/actions/browser`
- `POST /api/documents/analyze`
- `/v1/*` blueprint stubs for the documented WunderGraph-mediated public API surface

## Document Analysis

The Household page supports PDF, TXT, MD, CSV, JSON, and XML uploads. The server extracts text, requires explicit consent, sends extracted text to OpenAI when `OPENAI_API_KEY` is configured, and stores only structured analysis plus the merged Financial Twin in Redis. Raw document text is not persisted by the app.

## Hardened Container

The `Dockerfile` uses Chainguard Node images:

```bash
docker build -t ethos-ledger:local .
docker run --env-file .env -p 3000:3000 ethos-ledger:local
```
