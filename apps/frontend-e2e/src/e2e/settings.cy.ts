describe('Settings Page', () => {
  it('should show a success message after deleting read history', () => {
    cy.login();
    cy.visit('/settings');

    // Click the "Delete Read History" button
    cy.contains('button', 'Delete Read History')
      .should('be.visible')
      .click();

    // Confirmation dialog should appear
    cy.contains('Are you sure?').should('be.visible');

    // Click "Yes, delete everything" to confirm
    cy.contains('button', 'Yes, delete everything')
      .should('be.visible')
      .click();

    // Assert that one of the two success messages appears (not an error)
    cy.get('body', { timeout: 10000 }).should(($body) => {
      const text = $body.text();
      const hasNoHistory = text.includes(
        'No read history found to delete.',
      );
      const hasDeleted =
        /Successfully deleted \d+ read history records?\./.test(text);

      expect(
        hasNoHistory || hasDeleted,
        'Expected a success message (either "No read history found to delete." or "Successfully deleted X read history record(s).")',
      ).to.be.true;
    });
  });
});
