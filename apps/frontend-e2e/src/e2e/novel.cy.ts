describe('Novel Page', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/graphql').as('graphql');

    // First, visit home and navigate to a novel
    cy.visit('/');
    cy.wait('@graphql');

    // Click on the first novel to navigate to its page
    cy.get('a[href^="/novel/"]', { timeout: 10000 }).first().click();

    // Wait for novel page to load
    cy.url().should('include', '/novel/');
  });

  it('should load the novel page successfully', () => {
    // Verify novel title is visible
    cy.get('h1', { timeout: 10000 }).should('be.visible');
  });

  it('should display novel details', () => {
    cy.contains('button', /read first chapter/i).should('be.visible');
    cy.contains('button', /read latest chapter/i).should(
      'be.visible',
    );
    cy.get('body').should('contain.text', 'By');
  });

  it('should display chapter list', () => {
    cy.contains('h2', /chapters/i).should('be.visible');
    cy.contains('button', /chapter\s+\d+/i).should('be.visible');
  });

  it('should navigate to a chapter when clicking on chapter link', () => {
    cy.intercept('POST', '**/graphql').as('getChapter');

    // Click on first chapter
    cy.contains('button', /chapter\s+\d+/i, { timeout: 10000 })
      .first()
      .click();

    cy.wait('@getChapter');
    cy.contains('button', /back to novel/i).should('be.visible');
  });

  it('should display chapter content when a chapter is selected', () => {
    cy.intercept('POST', '**/graphql').as('getChapter');

    // Click on first chapter
    cy.contains('button', /chapter\s+\d+/i, { timeout: 10000 })
      .first()
      .click();

    cy.wait('@getChapter');

    // Verify chapter content is visible
    cy.get('.prose-container', { timeout: 10000 }).should(
      'be.visible',
    );
  });

  it('should display breadcrumbs for navigation', () => {
    cy.contains('nav a', /^home$/i, { timeout: 10000 }).should(
      'be.visible',
    );
  });

  it('should navigate back to home when clicking home in breadcrumbs', () => {
    cy.contains('nav a', /^home$/i, { timeout: 10000 }).click();

    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
