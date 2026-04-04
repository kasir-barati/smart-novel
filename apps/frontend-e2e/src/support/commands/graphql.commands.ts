Cypress.Commands.add('waitForGraphQL', (operationName: string) => {
  cy.intercept('POST', '/graphql', (req) => {
    if (req.body.operationName === operationName) {
      req.alias = operationName;
    }
  });
});

export {};
