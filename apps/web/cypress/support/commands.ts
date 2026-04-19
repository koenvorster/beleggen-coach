// ─── Type declarations for custom commands ────────────────────────────────────

interface UserProfile {
  goal: "pensioen" | "huis" | "studie" | "vermogen";
  monthly: number;
  years: number;
  risk: "rustig" | "licht" | "accepteer";
  createdAt: string;
}

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Stub the NextAuth session endpoint so client-side useSession() hooks
       * see a valid authenticated user.
       *
       * @param roles - Array of role strings (default: ['user'])
       * @example cy.stubSession(['admin'])
       */
      stubSession(roles?: string[]): Chainable<void>;

      /**
       * Seed a UserProfile into localStorage so the app behaves as if
       * the user completed onboarding.
       *
       * @param overrides - Partial profile to merge with the default fixture
       * @example cy.seedProfile({ goal: 'huis', monthly: 500 })
       */
      seedProfile(overrides?: Partial<UserProfile>): Chainable<void>;

      /**
       * Remove the stored profile from localStorage, simulating a
       * first-time visitor.
       */
      clearProfile(): Chainable<void>;

      /**
       * Stub all ETF-related API calls (GET /api/v1/etfs*) with the
       * cypress/fixtures/etfs.json fixture.
       *
       * Use this for client-side components that fetch ETFs directly.
       */
      stubEtfApi(): Chainable<void>;

      /**
       * Stub the plans API (GET /api/v1/users/:id/plans) with the
       * cypress/fixtures/plans.json fixture or a custom array.
       */
      stubPlansApi(plans?: object[]): Chainable<void>;

      /**
       * Stub the check-ins API (GET /api/v1/users/:id/checkins) with the
       * cypress/fixtures/checkins.json fixture or a custom array.
       */
      stubCheckinsApi(checkins?: object[]): Chainable<void>;
    }
  }
}

// ─── Custom command implementations ──────────────────────────────────────────

/**
 * Stub NextAuth v5 session endpoint so client-side auth hooks resolve with a
 * known user. Does NOT bypass server-side middleware — disable auth env vars
 * for full middleware bypass in test environments.
 */
Cypress.Commands.add("stubSession", (roles: string[] = ["user"]) => {
  cy.intercept("GET", "/api/auth/session", {
    statusCode: 200,
    body: {
      user: {
        name: "Sarah Test",
        email: "sarah@test.com",
        image: null,
      },
      roles,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  }).as("session");
});

/**
 * Write a complete UserProfile to localStorage before the page loads.
 * Call this in a cy.visit() callback or before visiting a page.
 */
Cypress.Commands.add("seedProfile", (overrides: Partial<UserProfile> = {}) => {
  const defaultProfile: UserProfile = {
    goal: "pensioen",
    monthly: 200,
    years: 20,
    risk: "licht",
    createdAt: "2025-01-15T10:00:00.000Z",
  };
  const profile = { ...defaultProfile, ...overrides };
  cy.window().then((win) => {
    win.localStorage.setItem("beleggen_profile", JSON.stringify(profile));
  });
});

/**
 * Remove profile from localStorage to simulate a fresh/first-time visitor.
 */
Cypress.Commands.add("clearProfile", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("beleggen_profile");
  });
});

/**
 * Stub client-side GET calls to the ETF API endpoint.
 * The server-side Next.js render uses mock data automatically when backend is
 * unreachable; this stub is specifically for client-rendered components
 * (compare page, plan page, dashboard) that call the API from the browser.
 */
Cypress.Commands.add("stubEtfApi", () => {
  cy.intercept(
    "GET",
    `${Cypress.env("apiUrl") ?? "http://localhost:8000"}/api/v1/etfs*`,
    { fixture: "etfs.json" }
  ).as("getEtfs");
});

/**
 * Stub the plans list endpoint. Defaults to the plans fixture.
 */
Cypress.Commands.add("stubPlansApi", (plans?: object[]) => {
  const body =
    plans !== undefined
      ? { success: true, data: plans, error: null }
      : undefined;

  if (body) {
    cy.intercept(
      "GET",
      `${Cypress.env("apiUrl") ?? "http://localhost:8000"}/api/v1/users/*/plans`,
      { statusCode: 200, body }
    ).as("getPlans");
  } else {
    cy.intercept(
      "GET",
      `${Cypress.env("apiUrl") ?? "http://localhost:8000"}/api/v1/users/*/plans`,
      { fixture: "plans.json" }
    ).as("getPlans");
  }
});

/**
 * Stub the checkins list endpoint. Defaults to the checkins fixture.
 */
Cypress.Commands.add("stubCheckinsApi", (checkins?: object[]) => {
  const body =
    checkins !== undefined
      ? { success: true, data: checkins, error: null }
      : undefined;

  if (body) {
    cy.intercept(
      "GET",
      `${Cypress.env("apiUrl") ?? "http://localhost:8000"}/api/v1/users/*/checkins`,
      { statusCode: 200, body }
    ).as("getCheckins");
  } else {
    cy.intercept(
      "GET",
      `${Cypress.env("apiUrl") ?? "http://localhost:8000"}/api/v1/users/*/checkins`,
      { fixture: "checkins.json" }
    ).as("getCheckins");
  }
});

export {};
