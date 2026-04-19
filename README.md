# Beleggingsapp — Monorepo Root

## Snel starten

### Vereisten
- Node.js 20+, pnpm 9+
- Python 3.12+, uv
- Docker (voor PostgreSQL + Redis lokaal)

### Installatie
```bash
# Frontend packages
pnpm install

# Backend API
cd apps/api && uv sync

# MCP server (investor-profile)
cd mcp/investor-profile-mcp && uv sync
```

### Database starten (Docker)
```bash
docker compose up -d
```

### Migraties uitvoeren
```bash
cd apps/api && uv run alembic upgrade head
```

### Development servers
```bash
# Frontend
pnpm --filter web dev

# Backend API
cd apps/api && uv run fastapi dev src/main.py

# MCP server (stdio mode — wordt aangeroepen door Copilot)
cd mcp/investor-profile-mcp && uv run python -m investor_profile_mcp.server
```

## Projectstructuur
Zie `docs/architecture/` voor uitgebreide architectuurdocumentatie.

## Custom Copilot Agents
Zie `.github/agents/` voor de beschikbare agents.
Gebruik ze door `@agent-naam` te typen in Copilot Chat.

## MCP Servers
Zie `mcp/` voor alle domeinspecifieke MCP servers.
Configureer ze in je Copilot MCP settings.
