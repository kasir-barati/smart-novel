/**
 * @description
 * Reusable Cypress logger. The log file is located at: `apps/frontend-e2e/cypress/logs/cypress-debug.log`.
 */
export function log(message: string): void {
  cy.task('log', message, { log: false });
}
