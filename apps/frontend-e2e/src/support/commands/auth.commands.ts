// README:
// Reusable ZITADEL login helper for Cypress e2e tests.
//
// Performs the full OIDC Authorization Code + PKCE flow through ZITADEL's Login V2 UI and waits until the app is authenticated.
//
// Selectors are based on ZITADEL Login V2 `data-testid` attributes:
// - https://github.com/zitadel/typescript/blob/main/acceptance/tests/loginname-screen.ts
// - https://github.com/zitadel/typescript/blob/main/acceptance/tests/password-screen.ts

// NOTE: Default credentials come from `local-setup/setup-zitadel/src/data/users.data.js`.
const DEFAULT_USERNAME = 'Writer';
const DEFAULT_PASSWORD = 'Writer123!';

Cypress.Commands.add(
  'login',
  (
    username: string = DEFAULT_USERNAME,
    password: string = DEFAULT_PASSWORD,
  ) => {
    // 1. Visit the home page and click the Login button
    cy.visit('/');
    cy.get('button[aria-label="Login"]', { timeout: 15000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // 2. ZITADEL Login V2 – enter the login name (username)
    cy.get('[data-testid="username-text-input"]', {
      timeout: 15000,
    }).type(username);
    cy.get('[data-testid="submit-button"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    // FIXME: Sometimes we click on the submit button but it does NOT go to the next page!

    // 3. Enter the password
    cy.get('[data-testid="password-text-input"]', {
      timeout: 15000,
    }).type(password);
    cy.get('[data-testid="submit-button"]')
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    // FIXME: Sometimes we click on the submit button but it does NOT go to the next page!

    // 4. Wait for the redirect back to the app and verify authentication
    cy.url({ timeout: 20000 }).should('not.include', '/ui/v2/login');

    // The header should now show the user's name (indicating successful login)
    cy.get('button[aria-label="Logout"]', { timeout: 15000 }).should(
      'be.visible',
    );
  },
);

Cypress.Commands.add('logout', () => {
  cy.visit('/');

  cy.get('body', { timeout: 15000 }).then(($body) => {
    if ($body.find('button[aria-label="Logout"]').length > 0) {
      cy.get('button[aria-label="Logout"]').click();
      cy.get('button[aria-label="Login"]', { timeout: 15000 }).should(
        'be.visible',
      );
    }
  });

  cy.get('button[aria-label="Login"]')
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  cy.clearAllCookies();
  cy.clearAllSessionStorage();
  cy.clearAllLocalStorage();
});

export {};
