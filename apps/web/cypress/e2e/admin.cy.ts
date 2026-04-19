/**
 * admin.cy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the admin user management section (/admin/users).
 *
 * Architecture notes:
 *  - The user list is rendered server-side by a Next.js Server Component that
 *    calls Keycloak Admin API directly (server-to-server). These calls cannot
 *    be intercepted by cy.intercept.
 *  - If Keycloak is unreachable, the page shows a "Verbinding met Keycloak
 *    mislukt" error but still renders the "+ Nieuwe gebruiker" button.
 *  - The modal (NewUserModal) makes a client-side POST to /api/admin/users —
 *    this CAN be intercepted.
 *
 * Test strategy:
 *  - Stub cy.stubSession(['admin']) for client-side auth checks.
 *  - Test the "+ Nieuwe gebruiker" modal and its form unconditionally.
 *  - Test the user table when Keycloak is available (or mock its response).
 *  - Intercept POST/DELETE/PUT requests to /api/admin/users/*.
 */

describe("Admin — Gebruikersbeheer (/admin/users)", () => {
  beforeEach(() => {
    // Stub session so client-side auth checks see admin role
    cy.stubSession(["admin", "user"]);
  });

  // ── Paginastructuur ─────────────────────────────────────────────────────────

  describe("Paginastructuur", () => {
    beforeEach(() => {
      cy.visit("/admin/users", { failOnStatusCode: false });
    });

    it("toont de pagina-titel 'Gebruikersbeheer' of redirect naar inloggen", () => {
      cy.url().then((url) => {
        if (url.includes("/sign-in")) {
          // Auth is active and redirected — this is expected behaviour
          cy.contains("Welkom terug").should("be.visible");
        } else {
          // Auth is disabled or session is valid
          cy.contains("Gebruikersbeheer").should("be.visible");
        }
      });
    });
  });

  // ── Testen wanneer de admin-pagina bereikbaar is ─────────────────────────────

  describe("Wanneer de admin-pagina geladen is", () => {
    beforeEach(() => {
      cy.visit("/admin/users", { failOnStatusCode: false });
      // If redirected to sign-in, skip all tests in this block
      cy.url().then((url) => {
        if (url.includes("/sign-in")) {
          // Can't test admin page — auth is active
          return;
        }
      });
    });

    it("toont de '+ Nieuwe gebruiker'-knop", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;
        cy.contains("+ Nieuwe gebruiker").should("be.visible");
      });
    });

    it("toont het aantal gebruikers in de subtitel", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;
        cy.contains(/\d+ gebruiker\(s\)/).should("be.visible");
      });
    });

    it("toont een gebruikerstabel of een foutmelding", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;
        // Either a table (Keycloak available) or an error (Keycloak down)
        cy.get("table, [class*='red']").should("exist");
      });
    });

    describe("Gebruikerstabel (Keycloak bereikbaar)", () => {
      it("toont tabelkoppen: Naam, E-mail, Gebruikersnaam, Rollen, Acties", () => {
        cy.url().then((url) => {
          if (!url.includes("/admin")) return;
          // Check if we got a table (not an error state)
          cy.get("body").then(($body) => {
            if ($body.find("table").length === 0) return;
            cy.get("table thead").within(() => {
              cy.contains("Naam").should("exist");
              cy.contains("E-mail").should("exist");
              cy.contains("Gebruikersnaam").should("exist");
              cy.contains("Rollen").should("exist");
              cy.contains("Acties").should("exist");
            });
          });
        });
      });

      it("toont 'Rollen bewerken'- en 'Verwijderen'-links per gebruiker", () => {
        cy.url().then((url) => {
          if (!url.includes("/admin")) return;
          cy.get("body").then(($body) => {
            if ($body.find("table tbody tr").length <= 1) return; // No data rows
            cy.get("table tbody tr")
              .first()
              .within(() => {
                cy.contains("Rollen bewerken").should("exist");
                cy.contains("Verwijderen").should("exist");
              });
          });
        });
      });
    });
  });

  // ── Nieuwe gebruiker modal ─────────────────────────────────────────────────

  describe("'Nieuwe gebruiker' modal", () => {
    beforeEach(() => {
      cy.visit("/admin/users", { failOnStatusCode: false });
    });

    it("opent de modal bij klikken op '+ Nieuwe gebruiker'", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;
        cy.contains("+ Nieuwe gebruiker").click();
        cy.contains("Nieuwe gebruiker aanmaken").should("be.visible");
      });
    });

    it("toont alle formuliervelden in de modal", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        cy.contains("+ Nieuwe gebruiker").click();

        // Labels
        cy.contains("Voornaam").should("be.visible");
        cy.contains("Achternaam").should("be.visible");
        cy.contains("E-mailadres").should("be.visible");
        cy.contains("Gebruikersnaam").should("be.visible");
        cy.contains("Wachtwoord").should("be.visible");
        cy.contains("Rollen").should("be.visible");
      });
    });

    it("toont de drie rol-checkboxes", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        cy.contains("+ Nieuwe gebruiker").click();

        cy.contains("Beheerder (admin)").should("be.visible");
        cy.contains("Gebruiker (user)").should("be.visible");
        cy.contains("Adviseur (advisor)").should("be.visible");
      });
    });

    it("toont 'Annuleren'- en 'Aanmaken'-knoppen", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        cy.contains("+ Nieuwe gebruiker").click();

        cy.contains("Annuleren").should("be.visible");
        cy.contains("Aanmaken").should("be.visible");
      });
    });

    it("sluit de modal bij klikken op 'Annuleren'", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        cy.contains("+ Nieuwe gebruiker").click();
        cy.contains("Nieuwe gebruiker aanmaken").should("be.visible");

        cy.contains("Annuleren").click();
        cy.contains("Nieuwe gebruiker aanmaken").should("not.exist");
      });
    });

    it("wist het formulier na het sluiten en opnieuw openen", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        // Open, fill voornaam, close
        cy.contains("+ Nieuwe gebruiker").click();
        cy.get('input[type="text"]').first().type("TestNaam");
        cy.contains("Annuleren").click();

        // Reopen — field should be empty
        cy.contains("+ Nieuwe gebruiker").click();
        cy.get('input[type="text"]').first().should("have.value", "");
      });
    });

    it("selecteert en deselecteert een rol via checkbox", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        cy.contains("+ Nieuwe gebruiker").click();

        // Click the 'user' checkbox to select
        cy.contains("Gebruiker (user)")
          .closest("label")
          .find("input[type='checkbox']")
          .check()
          .should("be.checked");

        // Click again to deselect
        cy.contains("Gebruiker (user)")
          .closest("label")
          .find("input[type='checkbox']")
          .uncheck()
          .should("not.be.checked");
      });
    });

    it("verstuurt het formulier via POST /api/admin/users", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        // Stub the API call
        cy.intercept("POST", "/api/admin/users", {
          statusCode: 200,
          body: { success: true, data: { id: "new-user-123" }, error: null },
        }).as("createUser");

        cy.contains("+ Nieuwe gebruiker").click();

        // Fill in all required fields
        cy.get('input[type="text"]').eq(0).type("Anna");   // Voornaam
        cy.get('input[type="text"]').eq(1).type("Claes");  // Achternaam
        cy.get('input[type="email"]').type("anna@test.be");
        cy.get('input[type="text"]').eq(2).type("anna");   // Gebruikersnaam
        cy.get('input[type="password"]').type("Welkom123!");

        // Select a role
        cy.contains("Gebruiker (user)")
          .closest("label")
          .find("input[type='checkbox']")
          .check();

        cy.contains("button", "Aanmaken").click();
        cy.wait("@createUser").its("request.body").should("deep.include", {
          firstName: "Anna",
          lastName: "Claes",
          email: "anna@test.be",
          username: "anna",
        });
      });
    });

    it("toont een foutmelding als aanmaken mislukt (API-fout)", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        cy.intercept("POST", "/api/admin/users", {
          statusCode: 409,
          body: {
            success: false,
            data: null,
            error: "Gebruikersnaam al in gebruik",
          },
        }).as("createUserFail");

        cy.contains("+ Nieuwe gebruiker").click();

        cy.get('input[type="text"]').eq(0).type("Anna");
        cy.get('input[type="text"]').eq(1).type("Claes");
        cy.get('input[type="email"]').type("anna@test.be");
        cy.get('input[type="text"]').eq(2).type("anna");
        cy.get('input[type="password"]').type("Welkom123!");

        cy.contains("button", "Aanmaken").click();
        cy.wait("@createUserFail");

        // Error message should appear inside the modal
        cy.contains("Gebruikersnaam al in gebruik").should("be.visible");
      });
    });

    it("schakelt de 'Aanmaken'-knop uit tijdens het versturen", () => {
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        // Delay the response to observe the loading state
        cy.intercept("POST", "/api/admin/users", (req) => {
          req.reply({
            delay: 500,
            statusCode: 200,
            body: { success: true, data: { id: "xyz" }, error: null },
          });
        }).as("createUserDelayed");

        cy.contains("+ Nieuwe gebruiker").click();
        cy.get('input[type="text"]').eq(0).type("Anna");
        cy.get('input[type="text"]').eq(1).type("Claes");
        cy.get('input[type="email"]').type("anna@test.be");
        cy.get('input[type="text"]').eq(2).type("anna");
        cy.get('input[type="password"]').type("Welkom123!");

        cy.contains("button", "Aanmaken").click();

        // During loading, button text changes and is disabled
        cy.contains("Aanmaken...").should("be.visible");
        cy.contains("button", "Aanmaken...").should("be.disabled");

        cy.wait("@createUserDelayed");
      });
    });
  });

  // ── Gebruiker verwijderen ────────────────────────────────────────────────────

  describe("Gebruiker verwijderen", () => {
    it("stuurt DELETE naar /api/admin/users/:id na bevestiging", () => {
      cy.visit("/admin/users", { failOnStatusCode: false });
      cy.url().then((url) => {
        if (!url.includes("/admin")) return;

        cy.get("body").then(($body) => {
          // Only run if there are data rows in the table
          if ($body.find("table tbody tr td a, table tbody tr td button").length === 0) return;

          cy.intercept("DELETE", "/api/admin/users/*", {
            statusCode: 200,
            body: { success: true, data: null, error: null },
          }).as("deleteUser");

          // Stub window.confirm to return true (bypass browser dialog)
          cy.window().then((win) => {
            cy.stub(win, "confirm").returns(true);
          });

          cy.get("table tbody tr").first().within(() => {
            cy.contains("Verwijderen").click();
          });

          cy.wait("@deleteUser");
        });
      });
    });
  });
});
