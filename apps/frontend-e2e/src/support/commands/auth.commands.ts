// README:
// Reusable ZITADEL login helper for Cypress e2e tests.
//
// Performs the full OIDC Authorization Code + PKCE flow through ZITADEL's Login V2 UI and waits until the app is authenticated.
//
// Selectors are based on ZITADEL Login V2 `data-testid` attributes:
// - https://github.com/zitadel/typescript/blob/main/acceptance/tests/loginname-screen.ts
// - https://github.com/zitadel/typescript/blob/main/acceptance/tests/password-screen.ts

import { log as baseLog } from '../logger';

// NOTE: Default credentials come from `local-setup/setup-zitadel/src/data/users.data.js`.
const DEFAULT_USERNAME = 'Writer';
const DEFAULT_PASSWORD = 'Writer123!';

const MAX_SUBMIT_RETRIES = 3;
const RETRY_WAIT_MS = 5000;

function log(message: string) {
  baseLog(`[AUTH] ${message}`);
}

/**
 * @description ZITADEL Login V2 sometimes swallows the submit-button click - the DOM element is visible and enabled, but the JS handler is not wired up yet (a race condition in their SPA hydration).
 *
 * This helper clicks the submit button and waits a short time for the next
 * page to appear. If it doesn't, it re-clicks up to {@link MAX_SUBMIT_RETRIES}
 * times before giving up.
 */
function clickSubmitWithRetry(
  nextPageSelector: string,
  stepName: string,
) {
  /**
   * @description
   * You cannot use a regular `for` loop here. This is fundamental to how Cypress works. Cypress commands (`cy.get()`, `cy.click()`, `cy.wait()`, etc.) are asynchronous and enqueued — they do **NOT** execute immediately. They're added to an internal command queue and run later. A `for` loop is synchronous JavaScript, so a normal foor loop won't work!
   */
  function attempt(remaining: number) {
    log(
      `${stepName}: clicking submit (attempts left: ${remaining})...`,
    );

    cy.get('[data-testid="submit-button"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // Wait a short time for the next page to appear
    cy.wait(RETRY_WAIT_MS);

    cy.get('body').then(($body) => {
      const nextPageAppeared =
        $body.find(nextPageSelector).length > 0;

      if (nextPageAppeared) {
        log(`${stepName}: navigation succeeded`);
        return;
      }

      if (remaining > 1) {
        log(
          `${stepName}: next page (${nextPageSelector}) not found — retrying...`,
        );
        attempt(remaining - 1);
        return;
      }

      log(`${stepName}: FAILED — exhausted all retries`);
      // Fall through and let the next assertion in the caller fail with a clear message
      cy.get(nextPageSelector, { timeout: 10000 }).should('exist');
    });
  }

  attempt(MAX_SUBMIT_RETRIES);
}

Cypress.Commands.add(
  'login',
  (
    username: string = DEFAULT_USERNAME,
    password: string = DEFAULT_PASSWORD,
  ) => {
    log(`=== LOGIN START (user: ${username}) ===`);

    // 1. Visit the home page and click the Login button
    log('Step 1: visiting home page...');
    cy.visit('/');

    log('Step 1: waiting for Login button...');
    cy.get('button[aria-label="Login"]', { timeout: 15000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    log('Step 1: Login button clicked');

    // 2. ZITADEL Login V2 – enter the login name (username)
    log('Step 2: waiting for username input...');
    cy.get('[data-testid="username-text-input"]', {
      timeout: 15000,
    }).type(username);
    log(`Step 2: typed username "${username}"`);

    cy.url().then((url) =>
      log(`Step 2: current URL before submit: ${url}`),
    );

    clickSubmitWithRetry(
      '[data-testid="password-text-input"]',
      'Step 2 (username submit)',
    );

    cy.url().then((url) =>
      log(`Step 2: current URL after submit: ${url}`),
    );

    // 3. Enter the password
    log('Step 3: typing password...');
    cy.get('[data-testid="password-text-input"]', {
      timeout: 15000,
    }).type(password);
    log('Step 3: password typed');

    cy.url().then((url) =>
      log(`Step 3: current URL before submit: ${url}`),
    );

    clickSubmitWithRetry(
      'button[aria-label="Logout"]',
      'Step 3 (password submit)',
    );

    // 4. Wait for the redirect back to the app and verify authentication
    cy.url({ timeout: 20000 }).should('not.include', '/ui/v2/login');

    cy.url().then((url) => log(`Step 4: URL after redirect: ${url}`));

    log('Step 5: waiting for Logout button (auth confirmation)...');
    cy.get('button[aria-label="Logout"]', { timeout: 15000 }).should(
      'be.visible',
    );

    cy.url().then((url) =>
      log(`=== LOGIN COMPLETE — final URL: ${url} ===`),
    );
  },
);

Cypress.Commands.add('logout', () => {
  log('=== LOGOUT START ===');
  cy.visit('/');

  cy.get('body', { timeout: 15000 }).then(($body) => {
    if ($body.find('button[aria-label="Logout"]').length === 0) {
      log('Logout button not found (already logged out)');
      return;
    }

    log('Logout button found, clicking...');
    cy.get('button[aria-label="Logout"]').click();
    cy.get('button[aria-label="Login"]', { timeout: 15000 }).should(
      'be.visible',
    );
  });

  cy.get('button[aria-label="Login"]')
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
  log('=== LOGOUT COMPLETE ===');
});

export {};
