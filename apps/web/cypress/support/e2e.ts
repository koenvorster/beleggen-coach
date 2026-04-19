// ─── Cypress E2E support entry point ─────────────────────────────────────────
// This file is loaded before every spec. Import custom commands and any
// global configuration here.

import "./commands";

// Fail tests loudly on any uncaught exception that isn't a known React/Next
// hydration noise in development mode.
Cypress.on("uncaught:exception", (err) => {
  // React hydration errors in dev — safe to ignore in E2E context
  if (
    err.message.includes("Hydration") ||
    err.message.includes("hydrat") ||
    err.message.includes("Minified React error")
  ) {
    return false;
  }
  // NextAuth CSRF / redirect errors that happen server-side
  if (
    err.message.includes("NEXT_REDIRECT") ||
    err.message.includes("CSRF")
  ) {
    return false;
  }
  return true;
});
