/**
 * plan.cy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the investment plan page (/plan).
 *
 * The plan page is a client component that:
 * - Reads a UserProfile from localStorage
 * - Fetches ETF suggestions from the API (gracefully degrades if unavailable)
 * - Shows growth simulation charts
 * - Allows saving a plan to the API
 * - Lists previously saved plans
 *
 * Auth note: /plan is in PROTECTED_ROUTES but auth is only enforced when
 * KEYCLOAK_CLIENT_ID + KEYCLOAK_CLIENT_SECRET env vars are set. In dev/test
 * without those vars, the page is accessible directly.
 */

const API_BASE = Cypress.env("apiUrl") ?? "http://localhost:8000";

describe("Beleggingsplan pagina (/plan)", () => {
  // ── Zonder profiel ──────────────────────────────────────────────────────────

  describe("Zonder onboarding-profiel", () => {
    beforeEach(() => {
      cy.stubEtfApi();
      cy.stubPlansApi([]);
      cy.visit("/plan", {
        onBeforeLoad(win) {
          win.localStorage.removeItem("beleggen_profile");
        },
      });
    });

    it("toont de planpagina met standaardsimulatie", () => {
      // Page renders with default values even without a profile
      cy.contains("Mijn beleggingsplan").should("be.visible");
    });

    it("toont de drie scenario's (pessimistisch, realistisch, optimistisch)", () => {
      cy.contains("Pessimistisch (3%)").should("be.visible");
      cy.contains("Realistisch (6%)").should("be.visible");
      cy.contains("Optimistisch (9%)").should("be.visible");
    });

    it("toont het groeisimulatie-diagram", () => {
      cy.contains("Groeisimulatie").should("be.visible");
      // Recharts renders an SVG
      cy.get("svg").should("exist");
    });

    it("toont de disclaimer over simulatie", () => {
      cy.contains("Simulatie — geen garantie op rendement").should(
        "be.visible"
      );
    });

    it("toont de disciplinetips sectie", () => {
      cy.contains("Disciplinetips").should("be.visible");
    });

    it("toont de 'Opgeslagen plannen' sectie", () => {
      cy.contains("Opgeslagen plannen").should("be.visible");
    });

    it("toont een lege staat voor opgeslagen plannen als er geen zijn", () => {
      cy.wait("@getPlans");
      cy.contains("Nog geen plannen opgeslagen").should("be.visible");
    });
  });

  // ── Met profiel ─────────────────────────────────────────────────────────────

  describe("Met een geldig onboarding-profiel", () => {
    beforeEach(() => {
      cy.stubEtfApi();
      cy.stubPlansApi([]);
      cy.visit("/plan", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "beleggen_profile",
            JSON.stringify({
              goal: "pensioen",
              monthly: 200,
              years: 20,
              risk: "licht",
              createdAt: "2025-01-15T10:00:00.000Z",
            })
          );
        },
      });
    });

    it("toont de simulatie op basis van het opgeslagen maandbedrag", () => {
      cy.contains("€200/maand").should("be.visible");
    });

    it("toont de juiste tijdshorizon uit het profiel (20 jaar)", () => {
      cy.contains("20 jaar").should("be.visible");
    });

    it("toont de risico-uitleg gebaseerd op het profiel", () => {
      cy.contains("Risico-uitleg").should("be.visible");
      // 'licht' risk maps to 'evenwichtig' in the explanation
      cy.contains("evenwichtig").should("be.visible");
    });

    it("toont de 'Plan opslaan'-knop wanneer een profiel aanwezig is", () => {
      cy.contains("Plan opslaan").should("be.visible");
    });

    it("toont het aanbevolen ETF zodra de API-data geladen is", () => {
      cy.wait("@getEtfs");
      // For 'licht' risk, VWCE should be suggested
      cy.contains("VWCE").should("be.visible");
    });

    it("toont de ETF-sectie 'Passend ETF voor jouw profiel'", () => {
      cy.wait("@getEtfs");
      cy.contains("Passend ETF voor jouw profiel").should("be.visible");
    });
  });

  // ── Plan opslaan ────────────────────────────────────────────────────────────

  describe("Plan opslaan via de API", () => {
    beforeEach(() => {
      cy.stubEtfApi();
      cy.stubPlansApi([]);

      // Stub the POST /plans endpoint for plan creation
      cy.intercept("POST", `${API_BASE}/api/v1/users/*/plans`, {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: "new-plan-001",
            user_id: "dev-user-00000000",
            etf_isin: "IE00BK5BQT80",
            etf_ticker: "VWCE",
            monthly_amount: 200,
            years: 20,
            goal: "pensioen",
            risk_profile: "licht",
            created_at: new Date().toISOString(),
          },
          error: null,
        },
      }).as("createPlan");

      cy.visit("/plan", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "beleggen_profile",
            JSON.stringify({
              goal: "pensioen",
              monthly: 200,
              years: 20,
              risk: "licht",
              createdAt: "2025-01-15T10:00:00.000Z",
            })
          );
        },
      });
    });

    it("activeert de 'Plan opslaan'-knop na het laden van de ETF-data", () => {
      cy.wait("@getEtfs");
      cy.contains("Plan opslaan").should("not.be.disabled");
    });

    it("toont een succesbericht na succesvol opslaan", () => {
      cy.wait("@getEtfs");
      cy.contains("Plan opslaan").click();
      cy.wait("@createPlan");
      cy.contains("Plan succesvol opgeslagen!").should("be.visible");
    });

    it("voegt het nieuwe plan toe aan de lijst na opslaan", () => {
      cy.wait("@getEtfs");
      cy.contains("Plan opslaan").click();
      cy.wait("@createPlan");

      // The new plan should appear in the saved plans list
      cy.contains("VWCE · €200/maand · 20 jaar").should("be.visible");
    });
  });

  // ── API-fout bij opslaan ────────────────────────────────────────────────────

  describe("API-fout bij plan opslaan", () => {
    beforeEach(() => {
      cy.stubEtfApi();
      cy.stubPlansApi([]);

      cy.intercept("POST", `${API_BASE}/api/v1/users/*/plans`, {
        statusCode: 500,
        body: {
          success: false,
          data: null,
          error: { code: "SERVER_ERROR", message: "Interne serverfout" },
        },
      }).as("createPlanFail");

      cy.visit("/plan", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "beleggen_profile",
            JSON.stringify({
              goal: "pensioen",
              monthly: 200,
              years: 20,
              risk: "licht",
              createdAt: "2025-01-15T10:00:00.000Z",
            })
          );
        },
      });
    });

    it("toont een foutmelding als het opslaan mislukt", () => {
      cy.wait("@getEtfs");
      cy.contains("Plan opslaan").click();
      cy.wait("@createPlanFail");
      cy.contains("Plan opslaan mislukt").should("be.visible");
    });
  });

  // ── Opgeslagen plannen lijst ────────────────────────────────────────────────

  describe("Opgeslagen plannen weergave", () => {
    beforeEach(() => {
      cy.stubEtfApi();
      // Stub with existing plans
      cy.stubPlansApi();

      cy.visit("/plan", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "beleggen_profile",
            JSON.stringify({
              goal: "pensioen",
              monthly: 200,
              years: 20,
              risk: "licht",
              createdAt: "2025-01-15T10:00:00.000Z",
            })
          );
        },
      });
    });

    it("toont opgeslagen plannen met ticker, bedrag en looptijd", () => {
      cy.wait("@getPlans");
      cy.contains("VWCE · €200/maand · 20 jaar").should("be.visible");
    });

    it("toont het doel en risicoprofiel van elk opgeslagen plan", () => {
      cy.wait("@getPlans");
      cy.contains("Pensioen opbouwen").should("be.visible");
      cy.contains("licht").should("be.visible");
    });

    it("toont de aanmaakdatum van elk opgeslagen plan", () => {
      cy.wait("@getPlans");
      // Date should be formatted in nl-BE locale (dd/mm/yyyy)
      cy.contains(/\d{2}\/\d{2}\/\d{4}/).should("be.visible");
    });
  });
});
