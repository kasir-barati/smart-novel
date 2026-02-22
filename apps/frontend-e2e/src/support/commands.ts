/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to wait for GraphQL response
       * @example cy.waitForGraphQL('novels')
       */
      waitForGraphQL(operationName: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('waitForGraphQL', (operationName: string) => {
  cy.intercept('POST', '/graphql', (req) => {
    if (req.body.operationName === operationName) {
      req.alias = operationName;
    }
  });
});

export {};
