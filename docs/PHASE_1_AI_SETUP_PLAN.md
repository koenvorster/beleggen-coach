# Beleggings Coach — Phase 1 AI Setup & Knowledge Transfer

## Problem Statement

The `beleggings_coach` project has a collection of agents, MCPs, and workflows, but lacks a unified, tool-agnostic AI architecture. The existing `.github/agents/*.md` files and `mcp/` servers are not systematized according to Clean Architecture or DDD principles. This creates:

- **No reusability across runtimes**: Agents defined for Claude Code can't easily be used via Copilot CLI or ChatGPT
- **Tight coupling to tools**: Agent logic is mixed with tool-specific execution details
- **Fragmented knowledge**: Skills and capabilities are scattered across files with no single source of truth
- **Scaling barrier**: Adding new agents or runtimes requires reimplementing core logic

## Proposed Approach

Introduce a **Clean Architecture + DDD-based AI Fleet framework** for the beleggings_coach project, following the proven patterns from `dev_agents`. This separates:

1. **Domain layer**: Tool-agnostic agent definitions, skills, workflows, policies
2. **Application layer**: Use cases, orchestration, quality gates
3. **Infrastructure layer**: Runtime adapters (Copilot CLI, Claude Code, ChatGPT), tool integrations, LLM providers
4. **Interfaces layer**: CLI, API, Web dashboards

**Phase 1 deliverables**:
- Unified knowledge base documenting AI Fleet principles and patterns
- Domain layer structure with core agents and skills mapped to beleggings_coach domain
- Migration of existing agents from `.github/agents/` into structured YAML definitions
- Agent definition schemas for validation and consistency
- MCP registry in domain layer
- Runtime adapters (Copilot CLI, Claude Code) documented
- Comprehensive README enabling easy agent usage

This foundation enables Phase 2 (multi-agent orchestration) and Phase 3 (evaluation & feedback loops).

---

## Phase 1 Todos

### T1: Knowledge Transfer & Audits
- **audit-dev-agents**: Analyze dev_agents AI Fleet structure, extract reusable patterns
- **audit-beleggen-current**: Review existing beleggings_coach agents, MCPs, structure
- **document-shared-knowledge**: Create reusable documentation of AI Fleet principles, DDD concepts, patterns

### T2: Design Core Stack
- **design-phase1-agents**: Define 3–5 core agents (Architect, Developer, Test Engineer, Domain Validator, ETF Analyst) with skill mappings

### T3: Build Domain Layer
- **setup-domain-layer**: Create `domain/agents`, `domain/skills`, `domain/workflows`, `domain/policies` directories
- **create-agent-schemas**: Define `agent.schema.yaml`, `skill.schema.yaml`, `workflow.schema.yaml`, `policy.schema.yaml`
- **migrate-existing-agents**: Convert `.github/agents/*.md` → `domain/agents/*.yaml` 
- **setup-mcp-registry**: Document all MCPs in `domain/skills/data/` and `domain/skills/domain-knowledge/`

### T4: Document Infrastructure & Runtime Adapters
- **document-runtime-adapters**: Define infrastructure adapters for Copilot CLI and Claude Code

### T5: Deliver Phase 1 Documentation
- **create-phase1-readme**: Comprehensive README with architecture, principles, agent catalog, usage examples
- **test-agent-activation**: Verify agents work in Copilot Chat, test `@agent` mentions

---

## Key Principles (Applied to This Project)

1. **Tool independence**: Agents defined in domain layer, not tied to Copilot CLI or Claude Code
2. **Define once, adapt many**: Same agent runs on multiple runtimes via adapters
3. **Skills are reusable**: Architect, Developer, Test Engineer skills used across multiple agents
4. **Workflows enforce quality**: Every feature flows through intake → design → implementation → test → security → release
5. **Domain-first**: Agent definitions use beleggings_coach domain language (ETF, portfolio, asset allocation, risk profile)
6. **MCP-aware**: MCPs (investor-profile, etf-data, behavior-coach, market-data, portfolio-plan) are domain skills, not tool-specific features
7. **Human-in-loop**: Key decisions (architecture, security, release) require human approval

---

## Success Criteria (End of Phase 1)

✅ Domain layer fully structured with YAML definitions for all core agents and skills  
✅ All existing agents migrated from `.github/agents/*.md` to `domain/agents/*.yaml`  
✅ Agent definition schemas created and validated  
✅ MCP registry created and documented  
✅ Runtime adapters (Copilot CLI, Claude Code) documented  
✅ Phase 1 README with architecture, principles, agent catalog, usage examples  
✅ Agents verified working in Copilot Chat with `@agent` mention syntax  
✅ Knowledge transfer documentation for future developers  

---

## Teams & Agents to Engage

| Phase | Agent Type | Task |
|-------|-----------|------|
| T1 | **explore agent** | Parallel audit of dev_agents and beleggings_coach structure |
| T1 | **document writer** | Create shared knowledge base from audit findings |
| T2–T3 | **Senior_test_agent** + **general-purpose** | Design agents and domain layer with DDD rigor |
| T4–T5 | **code-review** | Validate domain definitions, schemas, migration quality |
| T5 | **rubber-duck** | Critique Phase 1 architecture before finalizing |

---

## Architecture Overview (Phase 1 Scope)

```
beleggings_coach/
├── domain/
│   ├── agents/
│   │   ├── architect-ai.yaml
│   │   ├── developer-ai.yaml
│   │   ├── test-engineer-ai.yaml
│   │   ├── domain-validator-ai.yaml
│   │   └── etf-analyst-ai.yaml
│   ├── skills/
│   │   ├── architecture/
│   │   ├── development/
│   │   ├── testing/
│   │   ├── domain-knowledge/
│   │   │   └── beleggings-domain-model.yaml
│   │   └── data/
│   │       ├── etf-data-skill.yaml
│   │       ├── market-data-skill.yaml
│   │       └── portfolio-analysis-skill.yaml
│   ├── workflows/
│   │   ├── ai-feature-workflow.yaml
│   │   ├── etf-analysis-workflow.yaml
│   │   └── security-review-workflow.yaml
│   ├── policies/
│   │   ├── gdpr-policy.md
│   │   ├── investment-compliance-policy.md
│   │   └── human-approval-policy.md
│   └── quality-gates/
│       ├── architecture-gate.yaml
│       ├── compliance-gate.yaml
│       ├── evaluation-gate.yaml
│       └── release-gate.yaml
├── application/
│   ├── use-cases/
│   ├── orchestration/
│   └── contracts/
├── infrastructure/
│   ├── runtimes/
│   │   ├── copilot-cli/
│   │   └── claude-code/
│   └── providers/
├── interfaces/
│   └── cli/
├── mcp/
│   └── [existing MCPs refactored as domain skills]
├── .github/agents/
│   └── [deprecated — move to domain/agents/]
└── README.md
```

---

## Notes

- **dev_agents is the source of truth** for AI Fleet architecture. We adapt its principles for beleggings_coach domain.
- **MCPs are domain skills**: Each MCP (investor-profile, etf-data, etc.) is mapped to a skill in `domain/skills/`.
- **Copilot agent naming**: Keep `@architect`, `@developer`, `@test-engineer`, etc. for CLI convenience.
- **Backward compatibility**: Existing `.github/agents/*.md` can coexist during transition; domain layer becomes new source of truth.

---

## Next Steps After Phase 1

- **Phase 2**: Multi-agent orchestration, handoff workflows, decision records
- **Phase 3**: Evaluation loops, golden dataset for ETF analysis, feedback mechanisms
- **Phase 4**: Internal runtime, agent registry API, web dashboard
