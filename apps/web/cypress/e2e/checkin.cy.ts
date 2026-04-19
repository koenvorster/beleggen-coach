/**
 * checkin.cy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the monthly check-in wizard (/checkin) and the analytics page
 * (/analytics) that displays check-in history.
 *
 * The check-in page is a purely client-side 4-step form (no auth requirement
 * beyond middleware). The analytics page calls the check-ins API from the
 * browser — we stub that call so tests work without a backend.
 */

describe("Maandelijkse check-in (/checkin)", () => {
  // ── Paginastructuur ─────────────────────────────────────────────────────────

  describe("Paginastructuur", () => {
    beforeEach(() => {
      cy.visit("/checkin");
    });

    it("toont de pagina-titel", () => {
      cy.contains("Maandelijkse check-in").should("be.visible");
    });

    it("toont de ondertitel over de beleggingsreis", () => {
      cy.contains("beleggingsreis").should("be.visible");
    });
  });

  // ── Stap 0: Ingelegd? ──────────────────────────────────────────────────────

  describe("Stap 0 — Ingelegd deze maand?", () => {
    beforeEach(() => {
      cy.visit("/checkin");
    });

    it("toont de vraag 'Heb je deze maand ingelegd?'", () => {
      cy.contains("Heb je deze maand ingelegd?").should("be.visible");
    });

    it("toont een Ja- en een Nee-knop", () => {
      cy.contains("✅ Ja").should("be.visible");
      cy.contains("❌ Nee").should("be.visible");
    });

    it("gaat naar de aanmoedigingsstap bij 'Nee'", () => {
      cy.contains("❌ Nee").click();
      cy.contains("Geen probleem!").should("be.visible");
    });

    it("gaat naar de felicitatiestap bij 'Ja'", () => {
      cy.contains("✅ Ja").click();
      cy.contains("Geweldig gedaan!").should("be.visible");
    });
  });

  // ── Stap 1: Aanmoediging (niet ingelegd) ────────────────────────────────────

  describe("Stap 1a — Aanmoediging bij niet-inleggen", () => {
    beforeEach(() => {
      cy.visit("/checkin");
      cy.contains("❌ Nee").click();
    });

    it("toont de aanmoedigingstekst", () => {
      cy.contains("Geen probleem!").should("be.visible");
      cy.contains("Consistentie is belangrijker dan het exacte bedrag").should(
        "be.visible"
      );
    });

    it("toont 'Terug'- en 'Verder'-knoppen", () => {
      cy.contains("Terug").should("be.visible");
      cy.contains("Verder").should("be.visible");
    });

    it("kan teruggaan naar stap 0", () => {
      cy.contains("Terug").click();
      cy.contains("Heb je deze maand ingelegd?").should("be.visible");
    });

    it("gaat verder naar de emotie-stap", () => {
      cy.contains("Verder").click();
      cy.contains("Hoe voel je je vandaag over je beleggingen?").should(
        "be.visible"
      );
    });
  });

  // ── Stap 1b: Felicitatie (wel ingelegd) ─────────────────────────────────────

  describe("Stap 1b — Felicitatie bij inleggen", () => {
    beforeEach(() => {
      cy.visit("/checkin");
      cy.contains("✅ Ja").click();
    });

    it("toont het feest-bericht", () => {
      cy.contains("Geweldig gedaan!").should("be.visible");
      cy.contains("je dichter bij jouw doel").should("be.visible");
    });

    it("toont alleen de 'Verder'-knop (geen Terug)", () => {
      cy.contains("Verder").should("be.visible");
    });

    it("gaat verder naar de emotie-stap", () => {
      cy.contains("Verder").click();
      cy.contains("Hoe voel je je vandaag over je beleggingen?").should(
        "be.visible"
      );
    });
  });

  // ── Stap 2: Emotie ──────────────────────────────────────────────────────────

  describe("Stap 2 — Emotie selecteren", () => {
    beforeEach(() => {
      cy.visit("/checkin");
      cy.contains("✅ Ja").click();
      cy.contains("Verder").click();
    });

    it("toont de vier emotie-opties", () => {
      cy.contains("Rustig").should("be.visible");
      cy.contains("Bezorgd").should("be.visible");
      cy.contains("Gefrustreerd").should("be.visible");
      cy.contains("Enthousiast").should("be.visible");
    });

    it("blokkeer de 'Verder'-knop totdat een emotie geselecteerd is", () => {
      cy.contains("Verder").should("be.disabled");
    });

    it("toont een contextuele reactie bij het selecteren van 'Rustig'", () => {
      cy.contains("Rustig").click();
      cy.contains("Een rustig hoofd is de beste basis").should("be.visible");
    });

    it("toont een contextuele reactie bij het selecteren van 'Bezorgd'", () => {
      cy.contains("Bezorgd").click();
      cy.contains("Zorgen zijn normaal").should("be.visible");
    });

    it("toont een contextuele reactie bij het selecteren van 'Enthousiast'", () => {
      cy.contains("Enthousiast").click();
      cy.contains("enthousiasme is fijn").should("be.visible");
    });

    it("activeert de 'Verder'-knop na het selecteren van een emotie", () => {
      cy.contains("Rustig").click();
      cy.contains("Verder").should("not.be.disabled");
    });

    it("gaat naar stap 3 na selectie en klikken op Verder", () => {
      cy.contains("Rustig").click();
      cy.contains("Verder").click();
      cy.contains("Heb je de neiging om iets te veranderen").should(
        "be.visible"
      );
    });
  });

  // ── Stap 3: Intent ──────────────────────────────────────────────────────────

  describe("Stap 3 — Planwijziging intent", () => {
    beforeEach(() => {
      cy.visit("/checkin");
      cy.contains("✅ Ja").click();
      cy.contains("Verder").click();
      cy.contains("Rustig").click();
      cy.contains("Verder").click();
    });

    it("toont de vier keuzemogelijkheden", () => {
      cy.contains("Nee, ik hou me aan mijn plan").should("be.visible");
      cy.contains("Ik wil meer beleggen").should("be.visible");
      cy.contains("Ik wil minder beleggen").should("be.visible");
      cy.contains("Ik wil stoppen").should("be.visible");
    });

    it("blokkeer de 'Samenvatting'-knop totdat een optie gekozen is", () => {
      cy.contains("Samenvatting").should("be.disabled");
    });

    it("toont een pauze-waarschuwing bij 'Ik wil stoppen'", () => {
      cy.contains("Ik wil stoppen").click();
      cy.contains("Even pauzeren:").should("be.visible");
    });

    it("toont een pauze-waarschuwing bij 'Ik wil minder beleggen'", () => {
      cy.contains("Ik wil minder beleggen").click();
      cy.contains("Even pauzeren:").should("be.visible");
    });

    it("activeert de 'Samenvatting'-knop na een keuze", () => {
      cy.contains("Nee, ik hou me aan mijn plan").click();
      cy.contains("Samenvatting").should("not.be.disabled");
    });
  });

  // ── Stap 4: Samenvatting ────────────────────────────────────────────────────

  describe("Stap 4 — Samenvatting en coach-boodschap", () => {
    function completeCheckin(
      invested: boolean,
      emotion: string,
      intent: string
    ) {
      cy.visit("/checkin");
      cy.contains(invested ? "✅ Ja" : "❌ Nee").click();
      cy.contains("Verder").click();
      cy.contains(emotion).click();
      cy.contains("Verder").click();
      cy.contains(intent).click();
      cy.contains("Samenvatting").click();
    }

    it("toont de samenvatting met inleg, gevoel en planwijziging", () => {
      completeCheckin(true, "Rustig", "Nee, ik hou me aan mijn plan");

      cy.contains("Jouw check-in samenvatting").should("be.visible");
      cy.contains("Ingelegd deze maand:").should("be.visible");
      cy.contains("Gevoel:").should("be.visible");
      cy.contains("Planwijziging:").should("be.visible");
    });

    it("toont 'Ja ✅' bij ingelegd = ja", () => {
      completeCheckin(true, "Rustig", "Nee, ik hou me aan mijn plan");
      cy.contains("Ja ✅").should("be.visible");
    });

    it("toont 'Nee ❌' bij ingelegd = nee", () => {
      completeCheckin(false, "Rustig", "Nee, ik hou me aan mijn plan");
      cy.contains("Nee ❌").should("be.visible");
    });

    it("toont een positieve coach-boodschap bij rustig + plan houden", () => {
      completeCheckin(true, "Rustig", "Nee, ik hou me aan mijn plan");
      cy.contains("Jouw coach zegt:").should("be.visible");
      cy.contains("Consistentie is de sleutel").should("be.visible");
    });

    it("toont een waarschuwende boodschap bij bezorgd + stoppen", () => {
      completeCheckin(true, "Bezorgd", "Ik wil stoppen");
      cy.contains("Jouw coach zegt:").should("be.visible");
      cy.contains("de markt in het verleden altijd hersteld").should(
        "be.visible"
      );
    });

    it("toont een waarschuwende boodschap bij gefrustreerd", () => {
      completeCheckin(false, "Gefrustreerd", "Ik wil stoppen");
      cy.contains("Frustratie is begrijpelijk").should("be.visible");
    });

    it("toont een 'Tot volgende maand'-knop die terug naar dashboard gaat", () => {
      completeCheckin(true, "Rustig", "Nee, ik hou me aan mijn plan");
      cy.contains("Tot volgende maand 👋")
        .should("be.visible")
        .and("have.attr", "href")
        .and("include", "/dashboard");
    });
  });
});

// ── Analytics pagina (/analytics) ──────────────────────────────────────────

describe("Analytics overzicht (/analytics)", () => {
  describe("Paginastructuur en tabs", () => {
    beforeEach(() => {
      cy.stubCheckinsApi();
      cy.visit("/analytics", {
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

    it("toont de pagina-titel 'Analytisch overzicht'", () => {
      cy.contains("Analytisch overzicht").should("be.visible");
    });

    it("toont de vier samenvattingscijfers", () => {
      cy.contains("Maandelijkse inleg").should("be.visible");
      cy.contains("Looptijd").should("be.visible");
      cy.contains("Verwacht (7%)").should("be.visible");
      cy.contains("Totaal ingelegd").should("be.visible");
    });

    it("toont de drie navigatietabs", () => {
      cy.contains("Portefeuillegroei").should("be.visible");
      cy.contains("ETF-vergelijking").should("be.visible");
      cy.contains("Gedragspatronen").should("be.visible");
    });

    it("toont de groeisimulatie-tab standaard actief", () => {
      cy.contains("Simulatie portefeuillegroei").should("be.visible");
      cy.get("svg").should("exist"); // Recharts LineChart
    });
  });

  describe("Tab: Gedragspatronen met check-in data", () => {
    beforeEach(() => {
      cy.stubCheckinsApi();
      cy.visit("/analytics", {
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

    it("toont gedragspatronen na het laden van check-in data", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@getCheckins");

      cy.contains("Jouw gedragspatronen").should("be.visible");
    });

    it("toont de 'Maanden ingelegd'-statistiek", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@getCheckins");

      cy.contains("Maanden ingelegd").should("be.visible");
    });

    it("toont de panieksignaal-statistiek", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@getCheckins");

      cy.contains("Panieksignaal").should("be.visible");
    });

    it("toont de FOMO-statistiek", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@getCheckins");

      cy.contains("FOMO-moment").should("be.visible");
    });

    it("toont de gedragsscore", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@getCheckins");

      cy.contains("Gedragsscore:").should("be.visible");
    });

    it("toont een bar-chart met gedragspatronen", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@getCheckins");

      cy.get("svg").should("have.length.at.least", 1);
    });
  });

  describe("Tab: Gedragspatronen zonder check-in data", () => {
    beforeEach(() => {
      cy.stubCheckinsApi([]);
      cy.visit("/analytics", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "beleggen_profile",
            JSON.stringify({
              goal: "pensioen",
              monthly: 100,
              years: 10,
              risk: "rustig",
              createdAt: "2025-01-15T10:00:00.000Z",
            })
          );
        },
      });
    });

    it("toont een lege staat als er nog geen check-ins zijn", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@getCheckins");

      cy.contains("Nog geen data").should("be.visible");
    });
  });

  describe("Tab: ETF-vergelijking", () => {
    beforeEach(() => {
      cy.stubCheckinsApi([]);
      cy.visit("/analytics", {
        onBeforeLoad(win) {
          win.localStorage.setItem(
            "beleggen_profile",
            JSON.stringify({
              goal: "vermogen",
              monthly: 300,
              years: 15,
              risk: "accepteer",
              createdAt: "2025-01-15T10:00:00.000Z",
            })
          );
        },
      });
    });

    it("toont de ETF-scores in een bar-chart", () => {
      cy.contains("ETF-vergelijking").click();
      cy.contains("ETF-scores vergelijking").should("be.visible");
      cy.get("svg").should("exist");
    });

    it("toont de legenda 'Beginner-fit' en 'Discipline-fit'", () => {
      cy.contains("ETF-vergelijking").click();
      cy.contains("Beginner-fit").should("be.visible");
      cy.contains("Discipline-fit").should("be.visible");
    });
  });

  describe("API fout bij laden check-ins", () => {
    beforeEach(() => {
      cy.intercept(
        "GET",
        `${Cypress.env("apiUrl") ?? "http://localhost:8000"}/api/v1/users/*/checkins`,
        { statusCode: 503, body: { success: false, data: null, error: { code: "UNAVAILABLE", message: "Service niet beschikbaar" } } }
      ).as("checkinsFail");

      cy.visit("/analytics", {
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

    it("toont een foutmelding als de check-ins API niet beschikbaar is", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@checkinsFail");
      cy.contains("⚠️").should("be.visible");
    });

    it("toont een 'Opnieuw proberen'-knop bij een API-fout", () => {
      cy.contains("Gedragspatronen").click();
      cy.wait("@checkinsFail");
      cy.contains("Opnieuw proberen").should("be.visible");
    });
  });
});
