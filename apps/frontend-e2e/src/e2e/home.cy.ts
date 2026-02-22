describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the home page successfully', () => {
    cy.contains('h1', /novels|home|smart novel/i).should(
      'be.visible',
    );
  });

  it('should display novel cards', () => {
    // Wait for GraphQL request to complete
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Check if novel cards are displayed
    cy.get('[data-testid="novel-card"]', { timeout: 10000 }).should(
      'have.length.greaterThan',
      0,
    );
  });

  it('should navigate to a novel detail page when clicking on a card', () => {
    // Wait for novels to load
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Click on the first novel card
    cy.get('[data-testid="novel-card"]', { timeout: 10000 })
      .first()
      .click();

    // Verify navigation to novel page
    cy.url().should('include', '/novel/');
  });

  it('should display pagination if there are multiple pages', () => {
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Check if pagination exists (might not if there's only one page)
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="pagination"]').length > 0) {
        cy.get('[data-testid="pagination"]').should('be.visible');
      }
    });
  });

  it('should toggle theme when theme toggle is clicked', () => {
    // Check if theme toggle exists
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="theme-toggle"]').length > 0) {
        // Get initial class
        cy.get('html').then(($html) => {
          const initialClass = $html.attr('class');

          // Click theme toggle
          cy.get('[data-testid="theme-toggle"]').click();

          // Verify class changed
          cy.get('html').should(($newHtml) => {
            const newClass = $newHtml.attr('class');
            expect(newClass).to.not.equal(initialClass);
          });
        });
      }
    });
  });
});
