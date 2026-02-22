describe('Home Page', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/graphql').as('graphql');
    cy.visit('/');
    cy.wait('@graphql');
  });

  it('should load the home page successfully', () => {
    cy.contains('h1', /discover novels/i).should('be.visible');
  });

  it('should display novel cards', () => {
    // Novel cards are links to /novel/:id
    cy.get('a[href^="/novel/"]', { timeout: 10000 }).should(
      'have.length.greaterThan',
      0,
    );
  });

  it('should navigate to a novel detail page when clicking on a card', () => {
    // Click on the first novel card
    cy.get('a[href^="/novel/"]', { timeout: 10000 }).first().click();

    // Verify navigation to novel page
    cy.url().should('include', '/novel/');
  });

  it('should display pagination if there are multiple pages', () => {
    // Check if pagination exists (might not if there's only one page)
    cy.get('body').then(($body) => {
      if (
        $body.text().includes('Previous') &&
        $body.text().includes('Next')
      ) {
        cy.contains('button', 'Previous').should('be.visible');
        cy.contains('button', 'Next').should('be.visible');
      }
    });
  });

  it('should toggle theme when theme toggle is clicked', () => {
    cy.get('html').then(($html) => {
      const initialClass = $html.attr('class');

      cy.get('button[aria-label="Toggle theme"]').first().click();

      cy.get('html').should(($newHtml) => {
        const newClass = $newHtml.attr('class');
        expect(newClass).to.not.equal(initialClass);
      });
    });
  });
});
