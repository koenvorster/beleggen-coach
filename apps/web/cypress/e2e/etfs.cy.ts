/**
 * etfs.cy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the ETF explorer (/etfs) and comparison pages (/etfs/compare).
 *
 * The ETF list page is a Next.js Server Component that falls back to mock data
 * automatically when the backend is unreachable — so these tests work without
 * a running API server.
 *
 * The compare page is client-side and calls the API directly from the browser.
 * We stub that call with cy.stubEtfApi().
 */

describe("ETF Explorer (/etfs)", () => {
  // ── Paginastructuur ─────────────────────────────────────────────────────────

  describe("Paginastructuur en inhoud", () => {
    beforeEach(() => {
      cy.visit("/etfs");
    });

    it("toont de pagina-titel 'ETF's verkennen'", () => {
      cy.contains("ETF's verkennen").should("be.visible");
    });

    it("toont de educatieve disclaimer", () => {
      cy.contains("Educatief platform — geen financieel advies").should(
        "be.visible"
      );
    });

    it("toont minstens één ETF-kaart", () => {
      cy.get("[data-testid='etf-card']").should("have.length.at.least", 1);
    });

    it("toont ETF-kaarten met ticker, naam en kosten (TER)", () => {
      cy.get("[data-testid='etf-card']")
        .first()
        .within(() => {
          // Ticker (bold, large)
          cy.get(".text-lg.font-bold").should("exist");
          // TER costs
          cy.contains("Kosten (TER):").should("exist");
          // Beginnersvriendelijk score bar
          cy.contains("Beginnersvriendelijk").should("exist");
          // Vergelijk button
          cy.contains("Vergelijk").should("exist");
        });
    });

    it("toont de 'Accumulerend' of 'Uitkerend' badge op elke kaart", () => {
      cy.get("[data-testid='etf-card']")
        .first()
        .within(() => {
          cy.contains(/Accumulerend|Uitkerend/).should("be.visible");
        });
    });
  });

  // ── Zoekfunctie ─────────────────────────────────────────────────────────────

  describe("Zoeken op naam of ticker", () => {
    beforeEach(() => {
      cy.visit("/etfs");
    });

    it("toont een zoekveld met de juiste placeholder", () => {
      cy.get('input[placeholder="Zoek op naam of ticker..."]').should(
        "be.visible"
      );
    });

    it("filtert ETF's op ticker via het zoekveld", () => {
      cy.get('input[placeholder="Zoek op naam of ticker..."]').type("VWCE");
      cy.get("[data-testid='etf-card']").should("have.length.at.least", 1);
      cy.get("[data-testid='etf-card']")
        .first()
        .within(() => {
          cy.contains("VWCE").should("be.visible");
        });
    });

    it("toont 'Geen ETF's gevonden' bij een ongeldige zoekopdracht", () => {
      cy.get('input[placeholder="Zoek op naam of ticker..."]').type(
        "XXXXXXXXXNOTEXIST"
      );
      cy.contains("Geen ETF's gevonden").should("be.visible");
    });

    it("herstelt de lijst na het wissen van de zoekopdracht", () => {
      cy.get('input[placeholder="Zoek op naam of ticker..."]').type(
        "XXXXXXXXXNOTEXIST"
      );
      cy.contains("Geen ETF's gevonden").should("be.visible");

      cy.get('input[placeholder="Zoek op naam of ticker..."]').clear();
      cy.get("[data-testid='etf-card']").should("have.length.at.least", 1);
    });
  });

  // ── Categoriefilter ─────────────────────────────────────────────────────────

  describe("Categoriefilter", () => {
    beforeEach(() => {
      cy.visit("/etfs");
    });

    it("toont alle categorieknoppen", () => {
      cy.contains("Alle").should("be.visible");
      cy.contains("Aandelen Wereld").should("be.visible");
      cy.contains("Aandelen VS").should("be.visible");
      cy.contains("Obligaties").should("be.visible");
    });

    it("'Alle' is standaard actief (primaire achtergrond)", () => {
      cy.contains("button", "Alle").should("have.class", "bg-primary-500");
    });

    it("filtert op categorie 'Obligaties' via de URL-parameter", () => {
      cy.visit("/etfs?categorie=Obligaties");
      // ETFs shown should only be Obligaties or an empty state
      cy.get("[data-testid='etf-card']").each(($card) => {
        cy.wrap($card).within(() => {
          cy.contains("Obligaties").should("exist");
        });
      });
    });

    it("activeert de categorie-knop 'Aandelen Wereld' bij klikken", () => {
      cy.contains("button", "Aandelen Wereld").click();
      // URL should update with categorie parameter
      cy.url().should("include", "categorie=Aandelen%20Wereld");
    });

    it("keert terug naar alle ETF's bij klikken op 'Alle'", () => {
      // First go to filtered state
      cy.contains("button", "Aandelen VS").click();
      cy.url().should("include", "categorie=Aandelen%20VS");

      // Then click Alle
      cy.contains("button", "Alle").click();
      cy.url().should("not.include", "categorie=");
      cy.get("[data-testid='etf-card']").should("have.length.at.least", 3);
    });
  });

  // ── Vergelijkfunctie ────────────────────────────────────────────────────────

  describe("Vergelijken van ETF's", () => {
    beforeEach(() => {
      cy.visit("/etfs");
    });

    it("toont de 'Vergelijk'-knop op elke ETF-kaart", () => {
      cy.get("[data-testid='etf-card']")
        .first()
        .within(() => {
          cy.contains("Vergelijk").should("be.visible");
        });
    });

    it("markeert een ETF-kaart als geselecteerd voor vergelijking", () => {
      cy.get("[data-testid='etf-card']")
        .first()
        .within(() => {
          cy.contains("Vergelijk").click();
          // Button should turn to primary state
          cy.contains("Vergelijk").closest("button").should(
            "have.class",
            "bg-primary-500"
          );
        });
    });

    it("toont de vergelijkbalk na het selecteren van 2 ETF's", () => {
      // Select first ETF
      cy.get("[data-testid='etf-card']").eq(0).within(() => {
        cy.contains("Vergelijk").click();
      });
      // Select second ETF
      cy.get("[data-testid='etf-card']").eq(1).within(() => {
        cy.contains("Vergelijk").click();
      });

      // Sticky compare bar should appear
      cy.contains("ETF's geselecteerd:").should("be.visible");
      cy.contains("Vergelijk nu →").should("be.visible");
    });

    it("toont het aantal geselecteerde ETF's in de vergelijkbalk", () => {
      cy.get("[data-testid='etf-card']").eq(0).within(() => {
        cy.contains("Vergelijk").click();
      });
      cy.get("[data-testid='etf-card']").eq(1).within(() => {
        cy.contains("Vergelijk").click();
      });

      cy.contains("2 ETF's geselecteerd:").should("be.visible");
    });

    it("navigeert naar de vergelijkpagina via de vergelijkbalk", () => {
      cy.get("[data-testid='etf-card']").eq(0).within(() => {
        cy.contains("Vergelijk").click();
      });
      cy.get("[data-testid='etf-card']").eq(1).within(() => {
        cy.contains("Vergelijk").click();
      });

      cy.contains("Vergelijk nu →").click();
      cy.url().should("include", "/etfs/compare");
      cy.url().should("include", "a=");
      cy.url().should("include", "b=");
    });

    it("kan maximaal 3 ETF's selecteren voor vergelijking", () => {
      cy.get("[data-testid='etf-card']").eq(0).within(() => {
        cy.contains("Vergelijk").click();
      });
      cy.get("[data-testid='etf-card']").eq(1).within(() => {
        cy.contains("Vergelijk").click();
      });
      cy.get("[data-testid='etf-card']").eq(2).within(() => {
        cy.contains("Vergelijk").click();
      });

      cy.contains("3 ETF's geselecteerd:").should("be.visible");
    });

    it("deselecteert een ETF door nogmaals op 'Vergelijk' te klikken", () => {
      cy.get("[data-testid='etf-card']").eq(0).within(() => {
        cy.contains("Vergelijk").click();
        cy.contains("Vergelijk").click(); // deselect
      });
      cy.get("[data-testid='etf-card']").eq(1).within(() => {
        cy.contains("Vergelijk").click();
      });

      // Only 1 selected — bar should not appear (needs 2)
      cy.contains("ETF's geselecteerd:").should("not.exist");
    });
  });
});

// ── Vergelijkpagina (/etfs/compare) ─────────────────────────────────────────

describe("ETF Vergelijkpagina (/etfs/compare)", () => {
  describe("Met twee geselecteerde ETF's", () => {
    beforeEach(() => {
      // Stub the client-side API call
      cy.stubEtfApi();
      cy.visit("/etfs/compare?a=VWCE&b=IWDA");
    });

    it("toont de pagina-titel 'ETF's vergelijken'", () => {
      cy.contains("ETF's vergelijken").should("be.visible");
    });

    it("toont de vergelijkingstabel", () => {
      cy.wait("@getEtfs");
      cy.get("table").should("be.visible");
    });

    it("toont de ticker-koppen in de tabel", () => {
      cy.wait("@getEtfs");
      cy.get("table").within(() => {
        cy.contains("VWCE").should("be.visible");
        cy.contains("IWDA").should("be.visible");
      });
    });

    it("toont de tabelrijen met de verwachte kenmerken", () => {
      cy.wait("@getEtfs");
      cy.get("table").within(() => {
        cy.contains("Naam").should("exist");
        cy.contains("ISIN").should("exist");
        cy.contains("Categorie").should("exist");
        cy.contains("Kosten (TER)").should("exist");
        cy.contains("Type").should("exist");
        cy.contains("Beginner-score").should("exist");
      });
    });

    it("toont de disclaimer over financieel advies", () => {
      cy.contains("Dit is geen financieel advies").should("be.visible");
    });

    it("toont de 'Terug naar ETF's'-link", () => {
      cy.contains("Selecteer andere ETF's").should("be.visible");
    });
  });

  describe("Met minder dan twee ETF's", () => {
    beforeEach(() => {
      cy.stubEtfApi();
      cy.visit("/etfs/compare?a=VWCE");
    });

    it("toont een melding dat minstens 2 ETF's geselecteerd moeten zijn", () => {
      cy.wait("@getEtfs");
      cy.contains("Selecteer minstens 2 ETF's om te vergelijken.").should(
        "be.visible"
      );
    });

    it("toont een link om terug te gaan naar de ETF-lijst", () => {
      cy.wait("@getEtfs");
      cy.contains("Terug naar ETF's").should("be.visible");
    });
  });

  describe("Zonder URL-parameters", () => {
    beforeEach(() => {
      cy.stubEtfApi();
      cy.visit("/etfs/compare");
    });

    it("toont een instructie om ETF's te selecteren", () => {
      cy.wait("@getEtfs");
      cy.contains("Selecteer minstens 2 ETF's om te vergelijken.").should(
        "be.visible"
      );
    });
  });

  describe("Backend onbereikbaar (fallback naar mockdata)", () => {
    beforeEach(() => {
      // Simulate API failure — compare page should fall back to mock ETFs
      cy.intercept(
        "GET",
        `${Cypress.env("apiUrl") ?? "http://localhost:8000"}/api/v1/etfs*`,
        { forceNetworkError: true }
      ).as("etfError");

      cy.visit("/etfs/compare?a=VWCE&b=IWDA");
    });

    it("toont een fallback-melding over voorbeelddata", () => {
      cy.wait("@etfError");
      cy.contains("Tijdelijk worden voorbeelddata getoond").should(
        "be.visible"
      );
    });

    it("toont toch de vergelijkingstabel op basis van mockdata", () => {
      cy.wait("@etfError");
      cy.get("table").should("be.visible");
    });
  });
});
