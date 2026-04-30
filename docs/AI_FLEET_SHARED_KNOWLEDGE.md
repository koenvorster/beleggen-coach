# AI Fleet — Shared Knowledge Base

**Purpose:** Document reusable AI Fleet architecture patterns, DDD principles, and conventions that apply across `dev_agents` (template) and `beleggings_coach` (implementation).

**Version:** 1.0  
**Status:** Phase 1 Foundation Document

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Clean Architecture Layers](#clean-architecture-layers)
3. [DDD Concepts](#ddd-concepts)
4. [Agent Design Patterns](#agent-design-patterns)
5. [Skill Design & Reusability](#skill-design--reusability)
6. [Workflow & Quality Gates](#workflow--quality-gates)
7. [Runtime Adapters](#runtime-adapters)
8. [Policies & Governance](#policies--governance)
9. [File Naming & Organization Conventions](#file-naming--organization-conventions)
10. [Schema Definitions](#schema-definitions)
11. [MCPs as Domain Skills](#mcps-as-domain-skills)
12. [Bounded Contexts in Beleggings Coach](#bounded-contexts-in-beleggings-coach)

---

## Core Principles

### 1. Tool Independence

**Rule:** Agent definitions, skills, workflows, and policies are **tool-agnostic**. They do NOT depend on:
- Claude Code
- Copilot CLI
- ChatGPT
- Any specific runtime

**Why:** Enables reuse across multiple execution environments without reimplementation.

**Example:**
```yaml
# ✅ GOOD - Tool independent
id: architect-ai
name: Architect AI
purpose: Design system architecture before implementation
outputs:
  - architecture.md
  - api_contract.md
  - eval_plan.md

# ❌ BAD - Tool dependent
id: architect-ai
run_with: Claude Code
instructions: "Use the Claude Code interface to..."
```

### 2. Define Once, Adapt Many

**Rule:** Define agent/skill/workflow once in the **domain layer**. Implement runtime-specific adapters in the **infrastructure layer**.

**Pattern:**
```
domain/agents/architect-ai.yaml        ← Single definition
↓
infrastructure/runtimes/
  ├── claude-code/adapter.yaml          ← How to run in Claude Code
  ├── copilot-cli/adapter.yaml          ← How to run in Copilot CLI
  ├── chatgpt/adapter.yaml              ← How to run in ChatGPT
  └── internal-runtime/adapter.yaml     ← How to run internally
```

Each adapter translates the same domain definition to its runtime.

### 3. Skills Are Reusable Capabilities

**Rule:** Skills are domain capabilities, not tool-specific features. Multiple agents can share the same skill.

**Example:**
```yaml
# ONE skill definition
id: rag-design
name: RAG Design
category: architecture
used_by_agents:
  - architect-ai
  - test-ai
  - domain-ai-expert
```

When `architect-ai` runs, it uses `rag-design` skill regardless of runtime.

### 4. Workflows Enforce Quality

**Rule:** Every feature flows through a standardized workflow with mandatory quality gates.

**Standard Workflow:**
1. **Intake** → Validate scope & requirements
2. **Architecture** → Design system, define contracts
3. **Implementation** → Code, integrate MCPs
4. **Evaluation** → Test, measure, golden dataset
5. **Security** → Review threats, compliance, secrets
6. **Release** → Deploy, monitor, document

Each gate is a **quality-gate** resource that must pass before moving forward.

### 5. MCP-Aware Architecture

**Rule:** MCPs (Model Context Protocols) are **domain skills**, not tool integrations.

**Pattern:**
```
mcp/investor-profile-mcp/            ← MCP implementation
    └── pyproject.toml
domain/skills/data/
    └── investor-profile-skill.yaml   ← Skill definition that wraps the MCP
```

When an agent needs investor profile data, it uses the skill, which in turn calls the MCP.

---

## Clean Architecture Layers

### Layer 1: Domain

**Contains:** Tool-independent definitions of agents, skills, workflows, policies, quality gates.

**Principle:** No references to specific tools or runtimes.

**Structure:**
```
domain/
├── agents/                    # Agent definitions (YAML)
├── skills/                    # Skill definitions organized by category
│   ├── architecture/
│   ├── development/
│   ├── testing/
│   ├── domain-knowledge/
│   └── data/
├── workflows/                 # Workflow definitions (YAML)
├── policies/                  # Policy definitions (Markdown)
├── quality-gates/             # Quality gate definitions (YAML)
└── README.md                  # Domain layer documentation
```

**Guarantee:** If you read `domain/agents/architect-ai.yaml`, you learn what the agent does without knowing Claude Code or Copilot CLI exists.

### Layer 2: Application

**Contains:** Use cases, orchestration, business logic, contracts.

**Principle:** Describes HOW domain concepts work together (orchestration, handoffs, decisions).

**Structure:**
```
application/
├── use-cases/                 # Feature workflows (e.g., "create-etf-analyzer")
├── orchestration/             # Agent handoff rules, state management
└── contracts/                 # Schemas (agent.schema.yaml, skill.schema.yaml, etc.)
```

**Example Use Case:**
```
application/use-cases/create-etf-analyzer.md
├── Steps: intake → architecture → implementation → evaluation → security → release
├── Which agents participate (architect, developer, test-engineer, security-validator)
├── Quality gate dependencies
└── Decision records
```

### Layer 3: Infrastructure

**Contains:** Adapters for runtimes, tools, and LLM providers.

**Principle:** "How to run domain definitions on specific platforms."

**Structure:**
```
infrastructure/
├── runtimes/
│   ├── claude-code/          # Adapter: how agents run in Claude Code
│   ├── copilot-cli/          # Adapter: how agents run via Copilot CLI
│   ├── chatgpt/              # Adapter: how agents run via ChatGPT
│   └── internal-runtime/     # Adapter: how agents run internally
├── tools/                     # Tool integrations (Jira, Confluence, GitHub, etc.)
└── providers/                 # LLM provider configs (Anthropic, OpenAI, etc.)
```

**Example Runtime Adapter:**
```yaml
# infrastructure/runtimes/copilot-cli/adapter.yaml
id: copilot-cli
type: runtime_adapter
purpose: Execute domain agents through GitHub Copilot CLI

maps:
  agent_definition: task_prompt
  skills: referenced_instructions
  workflow_step: cli_task
  output_artifacts: generated_files
```

### Layer 4: Interfaces

**Contains:** How users and systems interact with AI Fleet.

**Structure:**
```
interfaces/
├── cli/                       # CLI commands (future: `ai-fleet feature create`)
├── api/                       # REST API (future: internal orchestration)
└── web/                       # Web dashboard (future: agent monitoring)
```

### Layer 5: Projects

**Contains:** Feature implementations (aggregates of agents, artifacts, decisions).

**Structure:**
```
projects/
├── _template/                 # Template for new features
│   ├── intake.md
│   ├── architecture.md
│   ├── api_contract.md
│   ├── eval_plan.md
│   ├── security_review.md
│   └── decisions/
├── etf-analyzer/              # Example: ETF analysis feature
├── portfolio-planner/
└── behavioral-coach/
```

---

## DDD Concepts

### Bounded Contexts

**Definition:** A bounded context is a clearly defined boundary within which a specific ubiquitous language is valid.

**Beleggings Coach Bounded Contexts:**

| Context | Ubiquitous Language | Aggregates | MCPs |
|---------|-------------------|-----------|------|
| **Investor Profile** | Profile, risk appetite, financial goals, constraints | InvestorProfile, GoalHierarchy, RiskProfile | investor-profile-mcp |
| **ETF Data** | ETF, ISIN, TER, asset class, sector, region | ETFDataset, ETFScore, ComparisonMatrix | etf-data-mcp |
| **Portfolio Planning** | Allocation, rebalancing, risk-adjusted return, correlation | Portfolio, AllocationStrategy, RebalancingRule | portfolio-plan-mcp |
| **Market Data** | Price, dividend, historical volatility, market events | MarketTick, HistoricalSeries, MarketEvent | market-data-mcp |
| **Behavioral Finance** | Bias, behavioral pattern, decision nudge, cognitive trap | BehavioralPattern, NudgeRecommendation | behavior-coach-mcp |
| **Learning & Education** | Course, module, learning objective, assessment | LearningPath, EducationalContent | learning-content-mcp |
| **Compliance & Governance** | GDPR, MiFID II, disclaimer, audit trail, consent | ComplianceRule, DisclaimerTemplate, AuditLog | (implicit) |

**Key Point:** Each bounded context has its own domain model, aggregate roots, and value objects. Agents communicate **across** contexts through well-defined interfaces (MCPs).

### Ubiquitous Language

**Definition:** The shared vocabulary between domain experts and developers.

**Example (Investor Profile Context):**
- ✅ "investor risk profile" (ubiquitous)
- ✅ "conservative, moderate, aggressive"
- ❌ "risk_level_integer" (too technical; breaks ubiquitous language)

**In Agent Definitions:**
```yaml
# domain/agents/domain-validator-ai.yaml
purpose: >
  Validate domain model consistency across bounded contexts.
  Ensure ubiquitous language is respected:
  - Investor risk profiles: conservative, moderate, aggressive
  - ETF classifications: by asset class, sector, region
  - Portfolio allocation: expressed as % allocation
  - Behavioral patterns: identified from user interactions
```

---

## Agent Design Patterns

### Agent Anatomy

Every agent has:

1. **Identity**
   - `id`: Unique kebab-case identifier
   - `name`: Human-readable name
   - `type`: "agent"

2. **Purpose & Responsibilities**
   - `purpose`: One sentence describing what the agent does
   - `responsibilities`: List of specific tasks

3. **Capabilities**
   - `skills`: Array of skill IDs this agent uses
   - `inputs`: What data the agent needs
   - `outputs`: Artifacts the agent produces

4. **Governance**
   - `policies`: Which policies apply (GDPR, security, etc.)
   - `quality_gates`: Which gates must pass

5. **Runtime Compatibility**
   - `runtime_compatibility`: List of runtimes the agent can run on

### Example Agent Definition

```yaml
# domain/agents/architect-ai.yaml
id: architect-ai
name: Architect AI
type: agent
layer: domain

purpose: >
  Design system architecture and data flows before implementation.
  Create contracts and evaluation strategies.

responsibilities:
  - Design system architecture
  - Define data flows
  - Create API contracts
  - Design evaluation metrics
  - Identify risks and mitigation

inputs:
  - feature_requirements
  - domain_model
  - constraints

outputs:
  - architecture.md
  - api_contract.md
  - eval_plan.md
  - risk_analysis.md
  - implementation_tasks.md

skills:
  - rag-design
  - api-contract-design
  - ddd-modeling
  - risk-analysis
  - domain-knowledge/beleggings-domain-model

policies:
  - gdpr-policy
  - logging-policy
  - human-approval-policy

quality_gates:
  - architecture-gate

runtime_compatibility:
  - claude-code
  - copilot-cli
  - chatgpt
  - internal-runtime

instructions: |
  # Architect AI — System Design Agent
  
  You are an AI architect specialized in designing systems for financial/investment domains.
  
  ## Your Responsibilities
  - Analyze requirements and domain model
  - Create clear, documented architectures
  - Design API contracts (OpenAPI format)
  - Plan evaluation and metrics
  - Identify risks
  
  ## Output Artifacts
  You MUST produce:
  1. architecture.md — System design, components, data flows
  2. api_contract.md — OpenAPI spec for APIs
  3. eval_plan.md — Evaluation metrics and test strategy
  4. risk_analysis.md — Identified risks and mitigations
  5. implementation_tasks.md — Breakdown of work for developers
  
  ## Key Principles
  - Respect ubiquitous language from bounded contexts
  - Follow Clean Architecture principles
  - Ensure compliance with investment regulations
```

### Agent Handoff Pattern

When one agent finishes, it **hands off** to the next via:

1. **Artifact Exchange**: Output artifacts from one stage → input to next
2. **Quality Gate**: Previous stage must pass gate before next stage starts
3. **Context Preservation**: Decision records and rationale passed forward

**Workflow:**
```
Architect AI produces:
├── architecture.md
├── api_contract.md
├── eval_plan.md
└── implementation_tasks.md
       ↓
       GATE: architecture-gate (human review)
       ↓
Developer AI receives:
├── architecture.md (as input)
├── api_contract.md (as specification)
├── implementation_tasks.md (as task breakdown)
└── Implements features
```

---

## Skill Design & Reusability

### Skill Anatomy

Every skill has:

1. **Identity**
   - `id`: Unique kebab-case identifier
   - `name`: Human-readable name
   - `category`: Which domain area (architecture, development, testing, data, security, domain-knowledge)

2. **Definition**
   - `purpose`: What the skill enables
   - `inputs`: What data/context the skill needs
   - `outputs`: What the skill produces

3. **Governance**
   - `related_policies`: Which policies apply
   - `used_by_agents`: Which agents use this skill

### Example Skill Definitions

**Architecture Skill:**
```yaml
# domain/skills/architecture/rag-design.yaml
id: rag-design
name: RAG Design
type: skill
layer: domain
category: architecture

purpose: >
  Design retrieval-augmented generation systems with clear data flows,
  retrieval strategies, and evaluation metrics.

inputs:
  - use_case: Description of what RAG will do
  - data_sources: Available data (documents, databases, etc.)
  - user_queries: Example queries the RAG will handle
  - constraints: Performance, latency, cost constraints

outputs:
  - retrieval_strategy: How documents will be retrieved
  - chunking_strategy: How documents will be split
  - embedding_model_recommendation: Which model to use
  - reranking_strategy: How to re-rank results
  - eval_metrics: How to evaluate RAG quality

related_policies:
  - gdpr-policy (data privacy)
  - prompt-injection-policy (security)

used_by_agents:
  - architect-ai
  - test-ai
  - domain-ai-expert
```

**Data Skill (MCP wrapper):**
```yaml
# domain/skills/data/investor-profile-skill.yaml
id: investor-profile-skill
name: Investor Profile Analysis
type: skill
layer: domain
category: data

purpose: >
  Retrieve and analyze investor profiles including risk preferences,
  financial goals, constraints, and behavioral patterns.

mcp_integration:
  tool: investor-profile-mcp
  location: mcp/investor-profile-mcp
  capabilities:
    - retrieve_profile_by_id
    - assess_risk_profile
    - identify_financial_goals
    - analyze_constraints

inputs:
  - investor_id: Unique identifier
  - analysis_type: Profile, risk, goals, constraints, all

outputs:
  - investor_profile_json: Complete profile object
  - risk_assessment: Risk profile (conservative/moderate/aggressive)
  - financial_goals: Parsed goals
  - constraints: Identified constraints
  - recommendation_ready: Whether profile is complete for recommendations

related_policies:
  - gdpr-policy (personal data)
  - investment-compliance-policy (MiFID II)

used_by_agents:
  - etf-analyst-ai
  - portfolio-planner-ai
  - domain-validator-ai
```

---

## Workflow & Quality Gates

### Standard Workflow Stages

```yaml
# domain/workflows/ai-feature-workflow.yaml
id: ai-feature-workflow
name: AI Feature Development Workflow
type: workflow

stages:
  - number: 1
    name: Intake
    agent: none (manual)
    description: Collect requirements, validate scope
    outputs:
      - intake.md
    gate: intake-gate

  - number: 2
    name: Architecture
    agent: architect-ai
    description: Design system, define contracts
    outputs:
      - architecture.md
      - api_contract.md
      - eval_plan.md
    gate: architecture-gate

  - number: 3
    name: Implementation
    agent: developer-ai
    description: Code implementation, MCP integration
    outputs:
      - implementation_code
      - service_definitions
      - integration_docs
    gate: implementation-gate

  - number: 4
    name: Evaluation
    agent: test-ai
    description: Test, measure, evaluate
    outputs:
      - test_results
      - eval_metrics
      - golden_dataset
    gate: evaluation-gate

  - number: 5
    name: Security Review
    agent: security-validator-ai
    description: Security threats, compliance, secrets
    outputs:
      - security_review.md
      - threat_analysis.md
      - compliance_checklist.md
    gate: security-gate

  - number: 6
    name: Release Preparation
    agent: devops-ai
    description: Deployment planning, monitoring setup
    outputs:
      - deployment_plan.md
      - monitoring_config.md
      - runbook.md
    gate: release-gate

handoff_rules:
  - stage_1_to_2: Intake outputs → Architect AI inputs
  - stage_2_to_3: Architecture outputs → Developer AI context
  - stage_3_to_4: Implementation code → Test AI validation
  - stage_4_to_5: Eval results → Security AI review
  - stage_5_to_6: Security approval → DevOps deployment prep
```

### Quality Gate Pattern

```yaml
# domain/quality-gates/architecture-gate.yaml
id: architecture-gate
name: Architecture Gate
type: quality_gate
layer: domain

purpose: >
  Verify architecture is sound before implementation.
  Human review and approval required.

triggered_by: architect-ai (completes)

checks:
  - design_is_clear: Architecture clearly documented
  - apis_defined: API contracts complete
  - dataflows_documented: Data flows clear
  - risks_identified: Risks and mitigations listed
  - eval_metrics_defined: How success will be measured
  - compliance_considered: MiFID II, GDPR considered
  - team_consensus: Architecture acceptable to team

approval_required: human
approvers:
  - domain-expert
  - tech-lead

artifacts_required:
  - architecture.md
  - api_contract.md
  - eval_plan.md
```

---

## Runtime Adapters

### Adapter Pattern

A runtime adapter translates a domain definition to runtime-specific instructions.

**Claude Code Adapter Example:**
```yaml
# infrastructure/runtimes/claude-code/adapter.yaml
id: claude-code
type: runtime_adapter
layer: infrastructure

purpose: >
  Execute AI Fleet agents inside a local codebase using Claude Code.

maps:
  agent_definition: system_prompt.md
  agent_instructions: contextual_markdown_files
  skill: referenced_documentation
  output_contract: required_artifacts
  workflow_step: claude_task_prompt

execution_style:
  - repository_aware
  - file_editing
  - iterative_refinement
  - human_in_the_loop

example_invocation: |
  When using Claude Code to run architect-ai:
  
  1. Load domain/agents/architect-ai.yaml
  2. Create system prompt from agent.instructions
  3. Reference domain/skills/architecture/ as context files
  4. Define required outputs: [architecture.md, api_contract.md, eval_plan.md]
  5. Run in Claude Code environment with repository context

limitations:
  - depends_on_local_repo_context
  - requires_manual_review
  - not_suitable_for_batch_operations
```

**Copilot CLI Adapter Example:**
```yaml
# infrastructure/runtimes/copilot-cli/adapter.yaml
id: copilot-cli
type: runtime_adapter
layer: infrastructure

purpose: >
  Execute AI Fleet tasks through GitHub Copilot CLI.

maps:
  agent_definition: task_prompt
  skills: referenced_instructions (via @mention syntax)
  workflow_step: cli_task_definition
  output_artifacts: generated_files_or_patches

execution_style:
  - github_oriented
  - file_generating
  - batch_capable
  - automation_friendly

example_invocation: |
  Command: gh copilot task architect-ai --input requirements.md
  
  System prompt loads from domain/agents/architect-ai.yaml
  Referenced skills included in context
  Output artifacts: architecture.md, api_contract.md, eval_plan.md

limitations:
  - less_suited_for_complex_multi_agent_orchestration
  - depends_on_github_tools
```

---

## Policies & Governance

### Policy Types

**Security Policies:**
- GDPR Policy: Data privacy, consent, data retention
- Prompt Injection Policy: Input validation, prompt escaping
- Secrets Policy: No credentials in code or artifacts

**Compliance Policies:**
- Investment Compliance Policy: MiFID II, investment disclaimers, no-advice boundaries
- Human Approval Policy: Which decisions require human review

**Observability Policies:**
- Logging Policy: What to log (agent decisions, tool calls, outcomes) without exposing sensitive data

### Example: Investment Compliance Policy

```markdown
# domain/policies/investment-compliance-policy.md

## MiFID II Compliance

### Rule 1: Investment Advice Boundary
- **No unsolicited investment advice** — agents must not recommend specific investments to retail investors
- **Recommendations only when requested** — after explicit investor consent
- **Disclaimer required** — every recommendation must include: "This is not financial advice"

### Rule 2: Suitability Assessment
- Before recommending ETF allocation, investor risk profile must be assessed
- Recommendation must match investor risk profile and financial goals
- Document suitability rationale

### Rule 3: Conflict of Interest
- No hidden incentives in recommendations
- Transparent about conflicts of interest
- Agent must disclose if using ETF data provider relationships

### Rule 4: Retention & Audit
- All recommendations and suitability assessments retained for 5 years
- Audit trail of which agent made which decision
- Traceability for compliance review

## GDPR Compliance

### Rule 1: Data Minimization
- Collect only necessary personal data
- Investor profile contains only what's needed for recommendations

### Rule 2: Consent & Opt-Out
- Explicit consent for behavioral pattern tracking
- Easy opt-out for data processing

### Rule 3: Data Retention
- Personal data retained only for intended purpose duration
- Automatic deletion after 3 years of inactivity
```

---

## File Naming & Organization Conventions

### File Naming Rules

| Entity | Pattern | Example |
|--------|---------|---------|
| Agent | `kebab-case.yaml` | `architect-ai.yaml`, `etf-analyst-ai.yaml` |
| Skill | `kebab-case.yaml` organized by category | `domain/skills/architecture/rag-design.yaml` |
| Workflow | `kebab-case.yaml` | `ai-feature-workflow.yaml` |
| Policy | `kebab-case.md` or `.yaml` | `gdpr-policy.md` |
| Quality Gate | `kebab-case.yaml` | `architecture-gate.yaml` |
| Runtime Adapter | `adapter.yaml` with supporting docs | `infrastructure/runtimes/copilot-cli/adapter.yaml` |

### Directory Structure Rules

```
domain/
├── agents/
│   ├── agent-name-1.yaml
│   ├── agent-name-2.yaml
│   └── agent.schema.yaml
├── skills/
│   ├── architecture/
│   │   ├── skill-name-1.yaml
│   │   └── skill-name-2.yaml
│   ├── development/
│   ├── testing/
│   ├── domain-knowledge/
│   ├── data/
│   └── skill.schema.yaml
├── workflows/
│   ├── workflow-name-1.yaml
│   └── workflow.schema.yaml
├── policies/
│   ├── policy-name-1.md
│   └── policy-name-2.md
├── quality-gates/
│   └── gate-name-1.yaml
└── README.md
```

---

## Schema Definitions

### Agent Schema

```yaml
# domain/contracts/agent.schema.yaml
$schema: http://json-schema.org/draft-07/schema#
title: Agent Definition
type: object

required:
  - id
  - name
  - type
  - layer
  - purpose
  - responsibilities
  - skills
  - outputs
  - policies
  - quality_gates
  - runtime_compatibility

properties:
  id:
    type: string
    pattern: ^[a-z0-9]+-[a-z0-9]*[a-z]$
    description: Unique identifier (kebab-case)

  name:
    type: string
    description: Human-readable name

  type:
    enum: ["agent"]

  layer:
    enum: ["domain"]

  purpose:
    type: string
    minLength: 50
    description: One or two sentence purpose statement

  responsibilities:
    type: array
    items:
      type: string
    minItems: 1

  skills:
    type: array
    items:
      type: string
    description: Skill IDs this agent uses

  outputs:
    type: array
    items:
      type: string
    minItems: 1
    description: Artifact names produced

  policies:
    type: array
    items:
      type: string
    description: Policy IDs that apply

  quality_gates:
    type: array
    items:
      type: string
    description: Quality gate IDs that apply

  runtime_compatibility:
    type: array
    items:
      enum: ["claude-code", "copilot-cli", "chatgpt", "internal-runtime"]
    minItems: 1
```

---

## MCPs as Domain Skills

### MCP → Skill Mapping

Each MCP in `mcp/` gets a corresponding skill definition in `domain/skills/data/` or `domain/skills/domain-knowledge/`.

**Pattern:**
```
mcp/investor-profile-mcp/
├── pyproject.toml              # Lists capabilities
├── investor_profile_mcp/
│   └── server.py
└── README.md

becomes

domain/skills/data/investor-profile-skill.yaml
├── id: investor-profile-skill
├── mcp_integration: { tool: investor-profile-mcp, location: mcp/investor-profile-mcp }
├── capabilities: [ retrieve_profile_by_id, assess_risk_profile, ... ]
├── inputs: [ investor_id, analysis_type ]
├── outputs: [ investor_profile_json, risk_assessment, ... ]
└── used_by_agents: [ etf-analyst-ai, portfolio-planner-ai, ... ]
```

### Beleggings Coach MCP Registry

| MCP | Domain Skill | Bounded Context | Status |
|-----|--------------|-----------------|--------|
| `investor-profile-mcp` | `investor-profile-skill.yaml` | Investor Profile | ✅ Ready |
| `etf-data-mcp` | `etf-data-skill.yaml` | ETF Data | ✅ Ready |
| `portfolio-plan-mcp` | `portfolio-plan-skill.yaml` | Portfolio Planning | ✅ Ready |
| `behavior-coach-mcp` | `behavior-coach-skill.yaml` | Behavioral Finance | ✅ Ready |
| `market-data-mcp` | `market-data-skill.yaml` | Market Data | 🔄 Placeholder |
| `learning-content-mcp` | `learning-content-skill.yaml` | Learning & Education | 🔄 Placeholder |

---

## Bounded Contexts in Beleggings Coach

### Investor Profile Context

**Domain Model:**
- `InvestorProfile` (aggregate root)
- `RiskProfile` (value object: conservative, moderate, aggressive)
- `FinancialGoal` (entity)
- `Constraint` (value object)

**MCP:** `investor-profile-mcp`

**Skills Used:**
- domain-knowledge/beleggings-domain-model
- data/investor-profile-skill

**Agents:**
- `etf-analyst-ai` (reads profiles to filter ETFs)
- `portfolio-planner-ai` (respects profiles in planning)
- `domain-validator-ai` (validates profile consistency)

---

### ETF Data Context

**Domain Model:**
- `ETF` (aggregate root)
- `ETFScore` (value object)
- `ComparisonMatrix` (entity)

**MCP:** `etf-data-mcp`

**Skills Used:**
- data/etf-data-skill

**Agents:**
- `etf-analyst-ai` (filters and scores ETFs)
- `architect-ai` (designs ETF comparison features)

---

### Portfolio Planning Context

**Domain Model:**
- `Portfolio` (aggregate root)
- `AllocationStrategy` (entity)
- `RebalancingRule` (entity)

**MCP:** `portfolio-plan-mcp`

**Skills Used:**
- data/portfolio-plan-skill
- testing/portfolio-simulation

**Agents:**
- `portfolio-planner-ai` (creates allocations)
- `test-ai` (evaluates allocations)

---

## Summary: Architecture Rule

**Golden Rule (put this in your README):**

> AI Fleet follows Clean Architecture principles.
>
> **Domain definitions must not depend on specific runtimes, tools, or vendors.**
>
> Agents, skills, workflows, policies and quality gates are defined once in the domain layer.
>
> Claude Code, Copilot CLI, ChatGPT, internal runtimes and future tools are implemented as adapters in the infrastructure layer.

---

## References

- Source: `dev_agents/README.md` (AI Fleet architectural vision)
- Source: `Project_beleggen/.github/copilot-instructions.md` (existing agents)
- Source: `Project_beleggen/mcp/` (existing MCP servers)
- Source: `Project_beleggen/docs/PHASE_1_AI_SETUP_PLAN.md` (Phase 1 plan)
