/**
 * onboarding.cy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the 4-step onboarding wizard (/onboarding) and verifies the resulting
 * profile is saved to localStorage and the user lands on the dashboard.
 *
 * The onboarding page is fully client-side with no auth requirement, so these
 * tests work without a running backend.
 */

describe("Onboarding wizard", () => {
  beforeEach(() => {
    // Start each test from a clean state — no existing profile
    cy.visit("/");
    cy.clearProfile();
  });

  // ── Landing page ────────────────────────────────────────────────────────────

  describe("Landing page (/)", () => {
    it("toont de hero-sectie met de juiste koppen", () => {
      cy.visit("/");
      cy.contains("Beleggen zonder stress").should("be.visible");
      cy.contains("op jouw tempo").should("be.visible");
    });

    it("toont drie feature-kaarten", () => {
      cy.visit("/");
      cy.contains("Leren terwijl je doet").should("be.visible");
      cy.contains("Jouw plan in minuten").should("be.visible");
      cy.contains("Rustig beleggen").should("be.visible");
    });

    it("bevat een CTA-knop naar de onboarding", () => {
      cy.visit("/");
      cy.contains("Maak mijn persoonlijk plan").should("be.visible");
      cy.contains("ETF's verkennen")
        .should("have.attr", "href")
        .and("include", "/etfs");
    });

    it("navigeert naar /onboarding via de CTA-knop", () => {
      cy.visit("/");
      cy.contains("Maak mijn persoonlijk plan").click();
      cy.url().should("include", "/onboarding");
    });

    it("navigeert naar /onboarding via de CTA-strip onderaan", () => {
      cy.visit("/");
      cy.contains("Start de vragenlijst").click();
      cy.url().should("include", "/onboarding");
    });
  });

  // ── Onboarding wizard ───────────────────────────────────────────────────────

  describe("Stap 0 — Doel selecteren", () => {
    beforeEach(() => {
      cy.visit("/onboarding");
    });

    it("toont de pagina-titel en stap-indicator", () => {
      cy.contains("Maak jouw plan").should("be.visible");
      cy.contains("4 eenvoudige vragen").should("be.visible");
      // Step indicator labels
      cy.contains("Doel").should("be.visible");
      cy.contains("Inleg").should("be.visible");
      cy.contains("Tijdshorizon").should("be.visible");
      cy.contains("Risico").should("be.visible");
    });

    it("toont de vier keuze-opties voor het doel", () => {
      cy.contains("Pensioen opbouwen").should("be.visible");
      cy.contains("Huis kopen").should("be.visible");
      cy.contains("Studie van mijn kind").should("be.visible");
      cy.contains("Vermogen opbouwen").should("be.visible");
    });

    it("blokkeer de 'Volgende'-knop totdat een doel geselecteerd is", () => {
      // Volgende button should be disabled/not-interactive
      cy.contains("Volgende").should("be.disabled");
    });

    it("activeert de 'Volgende'-knop na het selecteren van een doel", () => {
      cy.contains("Pensioen opbouwen").click();
      cy.contains("Volgende").should("not.be.disabled");
    });

    it("markeert het geselecteerde doel visueel", () => {
      cy.contains("Pensioen opbouwen").click();
      // The button gets border-primary-500 class when selected
      cy.contains("Pensioen opbouwen")
        .closest("button")
        .should("have.class", "border-primary-500");
    });
  });

  describe("Stap 1 — Maandelijks bedrag", () => {
    beforeEach(() => {
      cy.visit("/onboarding");
      // Select a goal and advance
      cy.contains("Pensioen opbouwen").click();
      cy.contains("Volgende").click();
    });

    it("toont de slider voor het maandbedrag", () => {
      cy.contains("Hoeveel wil je maandelijks inleggen?").should("be.visible");
      cy.get('input[type="range"]').should("exist");
    });

    it("toont de standaardwaarde van €200", () => {
      cy.contains("€200").should("be.visible");
    });

    it("toont de min- en maxwaarden van de slider (€25 – €1.000)", () => {
      cy.contains("€25").should("be.visible");
      cy.contains("€1.000").should("be.visible");
    });

    it("kan doorgaan naar stap 2 zonder aanpassingen", () => {
      cy.contains("Volgende").should("not.be.disabled").click();
      cy.contains("Hoe lang kun je wachten?").should("be.visible");
    });
  });

  describe("Stap 2 — Tijdshorizon", () => {
    beforeEach(() => {
      cy.visit("/onboarding");
      cy.contains("Pensioen opbouwen").click();
      cy.contains("Volgende").click(); // → stap 1
      cy.contains("Volgende").click(); // → stap 2
    });

    it("toont de slider voor het aantal jaren", () => {
      cy.contains("Hoe lang kun je wachten?").should("be.visible");
      cy.get('input[type="range"]').should("exist");
    });

    it("toont de standaard tijdshorizon van 10 jaar", () => {
      cy.contains(/^10$/).should("be.visible");
    });

    it("toont de grenzen 1 jaar en 40 jaar", () => {
      cy.contains("1 jaar").should("be.visible");
      cy.contains("40 jaar").should("be.visible");
    });

    it("kan doorgaan naar stap 3", () => {
      cy.contains("Volgende").click();
      cy.contains("Hoe voel je je bij schommelingen?").should("be.visible");
    });
  });

  describe("Stap 3 — Risicoprofiel en afronden", () => {
    beforeEach(() => {
      cy.visit("/onboarding");
      cy.contains("Pensioen opbouwen").click();
      cy.contains("Volgende").click(); // stap 1
      cy.contains("Volgende").click(); // stap 2
      cy.contains("Volgende").click(); // stap 3
    });

    it("toont de drie risico-opties", () => {
      cy.contains("Rustig slapen").should("be.visible");
      cy.contains("Licht ongemak").should("be.visible");
      cy.contains("Ik accepteer grote schommelingen").should("be.visible");
    });

    it("blokkeer de 'Maak mijn plan'-knop totdat risico geselecteerd is", () => {
      cy.contains("Maak mijn plan").should("be.disabled");
    });

    it("toont een samenvatting na selectie van risico", () => {
      cy.contains("Licht ongemak").click();
      // Summary card should appear
      cy.contains("Jouw samenvatting").should("be.visible");
      cy.contains("Pensioen opbouwen").should("be.visible");
      cy.contains("€200").should("be.visible");
    });

    it("activeert de 'Maak mijn plan'-knop na selectie van risico", () => {
      cy.contains("Licht ongemak").click();
      cy.contains("Maak mijn plan").should("not.be.disabled");
    });
  });

  // ── Volledig doorlopen ──────────────────────────────────────────────────────

  describe("Volledig doorlopen → opslaan → redirect", () => {
    beforeEach(() => {
      // Bypass Keycloak middleware zodat /dashboard bereikbaar is tijdens tests
      cy.authBypass();
    });

    it("voltooit alle stappen en redirect naar /dashboard", () => {
      cy.visit("/onboarding");

      // Stap 0: selecteer doel
      cy.contains("Pensioen opbouwen").click();
      cy.contains("Volgende").click();

      // Stap 1: standaard €200, geen wijziging
      cy.contains("Volgende").click();

      // Stap 2: standaard 10 jaar, geen wijziging
      cy.contains("Volgende").click();

      // Stap 3: selecteer risico
      cy.contains("Licht ongemak").click();
      cy.contains("Maak mijn plan").click();

      // Moet naar dashboard gaan
      cy.url().should("include", "/dashboard");
    });

    it("slaat het profiel correct op in localStorage", () => {
      cy.visit("/onboarding");

      cy.contains("Pensioen opbouwen").click();
      cy.contains("Volgende").click();
      cy.contains("Volgende").click();
      cy.contains("Volgende").click();
      cy.contains("Licht ongemak").click();
      cy.contains("Maak mijn plan").click();

      cy.url().should("include", "/dashboard");

      // Verify localStorage was set correctly
      cy.window().then((win) => {
        const raw = win.localStorage.getItem("beleggen_profile");
        expect(raw).to.not.be.null;
        const profile = JSON.parse(raw!);
        expect(profile.goal).to.equal("pensioen");
        expect(profile.risk).to.equal("licht");
        expect(profile.monthly).to.equal(200);
        expect(profile.createdAt).to.be.a("string");
      });
    });

    it("toont een gepersonaliseerde samenvatting op het dashboard na onboarding", () => {
      cy.visit("/onboarding");

      cy.contains("Pensioen opbouwen").click();
      cy.contains("Volgende").click();
      cy.contains("Volgende").click();
      cy.contains("Volgende").click();
      cy.contains("Licht ongemak").click();
      cy.contains("Maak mijn plan").click();

      cy.url().should("include", "/dashboard");

      // Dashboard should show profile stats
      cy.contains("Pensioen opbouwen").should("be.visible");
      cy.contains("Maandelijkse inleg").should("be.visible");
      cy.contains("€ 200").should("be.visible");
    });

    it("toont een welkomstscherm op dashboard als er geen profiel is", () => {
      // Visit dashboard without completing onboarding
      cy.visit("/dashboard");
      cy.clearProfile();
      cy.reload();

      cy.contains("Welkom bij BeleggenCoach").should("be.visible");
      cy.contains("Maak mijn plan").should("be.visible");
    });
  });

  // ── Navigatie ───────────────────────────────────────────────────────────────

  describe("Terug-navigatie in de wizard", () => {
    it("de terug-knop op stap 0 is onzichtbaar", () => {
      cy.visit("/onboarding");
      cy.contains("Terug").should("have.css", "opacity", "0");
    });

    it("de terug-knop op stap 1 brengt terug naar stap 0", () => {
      cy.visit("/onboarding");
      cy.contains("Pensioen opbouwen").click();
      cy.contains("Volgende").click();
      cy.contains("Terug").click();
      cy.contains("Wat is je doel?").should("be.visible");
    });
  });
});
