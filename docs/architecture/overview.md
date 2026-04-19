# Architectuuroverzicht

## Systeemlagen

```
┌─────────────────────────────────────────────┐
│              Next.js Frontend               │
│  (onboarding · dashboard · ETF · plan · leer)│
└──────────────────┬──────────────────────────┘
                   │ REST / JSON
┌──────────────────▼──────────────────────────┐
│            FastAPI Backend (apps/api)        │
│  routers · services · models · alembic      │
└──────┬───────────────────────┬──────────────┘
       │ SQLAlchemy (async)    │ Redis cache
┌──────▼──────┐        ┌───────▼──────┐
│ PostgreSQL  │        │    Redis     │
└─────────────┘        └──────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              MCP Servers (mcp/)              │
│  investor-profile · etf-data · market-data  │
│  portfolio-plan · behavior-coach · learning  │
└─────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│        GitHub Copilot + Custom Agents        │
│         (.github/agents/*.agent.md)          │
└─────────────────────────────────────────────┘
```

## MCP communicatie
MCP servers draaien via stdio protocol.
Copilot roept tools aan; de servers antwoorden met JSON.
Elke tool volgt het patroon: `{ success, data, error }`.

## Fase 6 — Nieuwe architectuurlagen

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│  / · /dashboard · /etfs · /plan · /learn · /checkin        │
│  + /chat · /portfolio · /analytics · /bronnen · /auth      │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST + SSE (streaming chat)
┌─────────────────────────▼───────────────────────────────────┐
│                   FastAPI Backend                           │
│  + /chat (OpenAI streaming) · /portfolio · /top3           │
└──────────┬───────────────────────────┬──────────────────────┘
           │                           │
    ┌──────▼──────┐            ┌───────▼──────┐
    │ PostgreSQL  │            │  Redis cache │
    │ + Portfolio │            │  + Chat mem  │
    │ + Position  │            └──────────────┘
    └─────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                      MCP Servers                            │
│  + etf-data-mcp: get_top3_for_profile (nieuw)              │
│  + live-market-mcp (nieuw): yfinance/Alpha Vantage         │
└─────────────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                   Externe diensten                          │
│  Clerk (auth) · OpenAI API (chat) · Yahoo Finance (koersen)│
└─────────────────────────────────────────────────────────────┘
```

## Dataflow bij onboarding
1. Frontend wizard → POST /api/onboarding/profile
2. API valideert + slaat op in PostgreSQL
3. `investor-profile-mcp` leest profiel en berekent risicoscore
4. `etf-data-mcp` filtert ETFs op basis van profiel
5. `portfolio-plan-mcp` genereert een eerste plan
6. Frontend toont resultaat op dashboard
