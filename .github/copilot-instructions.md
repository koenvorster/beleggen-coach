# Copilot Repository Instructions — Beleggingsapp

## Project context
AI-beleggingscoach voor beginnende beleggers. Focus: ETF-keuze, planvorming, gedragscoaching.
Doelgroep: mensen zonder beleggingservaring.
MVP-scope: educatie, vergelijking, simulatie — GEEN gereguleerd financieel advies.

## Tech stack
- **Backend**: Python 3.12 + FastAPI, PostgreSQL 16, Redis, Alembic migraties
- **MCP servers**: Python (mcp SDK) of TypeScript, één server per domein
- **Frontend**: Next.js 15, React 19, TypeScript strict, Tailwind CSS
- **Shared types**: TypeScript in packages/shared-types
- **Monorepo tooling**: pnpm workspaces (frontend), uv (Python)

## Coding standards

### Python
- Type hints verplicht op alle functies
- Pydantic v2 voor datavalidatie en schemas
- Async/await voor alle I/O
- Docstrings op elke publieke functie (Google style)
- Geen business logic in routers — altijd via service-laag

### TypeScript / React
- Strict mode aan (`"strict": true`)
- Geen `any` types
- Server Components by default, Client Components enkel als nodig
- Props altijd met interface gedefinieerd
- Tailwind utility classes, geen inline styles

### MCP servers
- Elke tool heeft een JSON Schema voor input én output
- Tool names in snake_case
- Altijd een `error` field in output bij falen
- Resources zijn read-only en stateless

## Output contracts (JSON)
Alle MCP tool outputs volgen dit patroon:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
Bij fout:
```json
{
  "success": false,
  "data": null,
  "error": { "code": "PROFILE_NOT_FOUND", "message": "..." }
}
```

## Taal & UX-regels
- Alle gebruikersgerichte tekst in **Nederlands**
- Geen financieel jargon zonder uitleg
- Scores altijd in **mensentaal** uitleggen, nooit als kaal getal
- Geen "koop dit nu" taal — altijd "kan logisch zijn omdat..."

## Juridische grenzen
- App = educatie + coaching + simulatie, GEEN beleggingsadvies
- Elke pagina met ETF-informatie heeft een disclaimer
- Nooit "aanbevelen", altijd "past mogelijk bij jouw profiel omdat..."

## Git workflow
- Branch namen: `feat/`, `fix/`, `chore/`
- Commit messages: Conventional Commits (`feat: ...`, `fix: ...`)
- PR beschrijving: wat, waarom, hoe getest

## Agent fleet

### Development workflow agents
Gebruik deze agents voor het bouwen van nieuwe features (Fase 6 en verder):

| Agent | Aanroep | Wanneer gebruiken |
|-------|---------|-------------------|
| Architect | `@architect` | Nieuwe feature ontwerpen, DDD bounded contexts, MCP-integraties |
| Developer | `@developer` | Backend implementatie, MCP tools, migraties, TypeScript componenten |
| Test Engineer | `@test-engineer` | Testplan opstellen, testcode schrijven, testpyramide |
| Code Reviewer | `@code-reviewer` | Code review voor merge, clean code controle |
| Security Check | `@security-check` | Auth review, GDPR check, financiële compliance |
| DDD Modeler | `@ddd-modeler` | Tactisch DDD: aggregates, value objects, domain events |
| Playwright | `@playwright` | E2E tests, user journeys, accessibility checks |
| Regression Selector | `@regression-selector` | Bepaal welke tests herdraaien na een wijziging |
| Test Data Designer | `@test-data-designer` | Boundary datasets, edge cases, fixtures voor ETF/profiel data |
| Domain Validator | `@domain-validator` | Valideer domeinregels en business constraints |

### Domein-inhoudelijke agents
Gebruik deze agents voor inhoudelijke domeinkennis:

| Agent | Aanroep | Wanneer gebruiken |
|-------|---------|-------------------|
| ETF Analyst | `@etf-analyst` | ETF-scores, vergelijkingen, uitlegbare teksten |
| Behavior Coach | `@behavior-coach` | Gedragspatronen, nudges, reflectievragen |
| MCP Architect | `@mcp-architect` | MCP tool contracts, JSON schemas |
| Data Engineer | `@data-engineer` | Data pipelines, Alembic migraties, ingestion services |
| Frontend Mentor | `@frontend-mentor` | UI-flows, component design, UX-principes |
| Compliance Check | `@compliance-check` | Juridische grenzen, disclaimers |
| Product Strategist | `@product-strategist` | Feature prioritering, product beslissingen |

### Runtime AI-agents (Ollama)
Deze agents draaien in de applicatie zelf via `apps/api/src/ai/`:

| Agent | Model | Doel |
|-------|-------|------|
| Gedragscoach | llama3 | Reflectievragen, emotioneel beleggen coachen |
| ETF Adviseur | mistral | ETF-eigenschappen uitleggen in begrijpbare taal |
| Leer Assistent | llama3 | Beleggingsconcepten uitleggen voor beginners |
| Plan Generator | mistral | Educatief beleggingsplan genereren op basis van profiel |

Runtime endpoints: `POST /api/v1/ai/chat`, `/etf/uitleg`, `/leer`, `/plan`, `/feedback`
Health check: `GET /api/v1/ai/health`

### Aanbevolen workflow voor nieuwe features (Fase 6)
1. `@architect` — Ontwerp de architectuur en bounded contexts
2. `@ddd-modeler` — Modelleer aggregates en domain events
3. `@developer` — Implementeer backend/frontend/MCP
4. `@test-engineer` + `@test-data-designer` — Schrijf tests en bereid testdata voor
5. `@playwright` — Schrijf E2E tests voor kritieke flows
6. `@code-reviewer` — Review voor merge
7. `@security-check` + `@compliance-check` — Finale checks bij auth/data features
8. `@regression-selector` — Bepaal regressietests na merge
