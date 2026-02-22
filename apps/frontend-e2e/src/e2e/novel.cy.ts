describe('Novel Page', () => {
  beforeEach(() => {
    // First, visit home and get a novel ID
    cy.visit('/');
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Click on the first novel to navigate to its page
    cy.get('[data-testid="novel-card"]', { timeout: 10000 })
      .first()
      .click();

    // Wait for novel page to load
    cy.url().should('include', '/novel/');
  });

  it('should load the novel page successfully', () => {
    // Verify novel title is visible
    cy.get('h1', { timeout: 10000 }).should('be.visible');
  });

  it('should display novel details', () => {
    // Check for novel metadata
    cy.get('body').should('be.visible');

    // Wait for novel data to load
    cy.intercept('POST', '**/graphql').as('getNovel');
    cy.wait('@getNovel', { timeout: 10000 });

    // Verify some content is present
    cy.get('body').should('contain.text', 'Chapter');
  });

  it('should display chapter list', () => {
    // Wait for chapters to load
    cy.intercept('POST', '**/graphql').as('getChapters');
    cy.wait('@getChapters');

    // Check if chapters are displayed
    cy.get('[data-testid="chapter-list"]', { timeout: 10000 }).should(
      'be.visible',
    );
    cy.get('[data-testid="chapter-item"]').should(
      'have.length.greaterThan',
      0,
    );
  });

  it('should navigate to a chapter when clicking on chapter link', () => {
    // Wait for chapters to load
    cy.intercept('POST', '**/graphql').as('getChapters');
    cy.wait('@getChapters');

    // Click on first chapter
    cy.get('[data-testid="chapter-item"]', { timeout: 10000 })
      .first()
      .click();

    // Verify navigation to chapter
    cy.url().should('include', '/chapter/');
  });

  it('should display chapter content when a chapter is selected', () => {
    // Wait for chapters to load
    cy.intercept('POST', '**/graphql').as('getChapters');
    cy.wait('@getChapters');

    // Click on first chapter
    cy.get('[data-testid="chapter-item"]', { timeout: 10000 })
      .first()
      .click();

    // Wait for chapter content to load
    cy.intercept('POST', '**/graphql').as('getChapterContent');
    cy.wait('@getChapterContent');

    // Verify chapter content is visible
    cy.get('[data-testid="chapter-content"]', {
      timeout: 10000,
    }).should('be.visible');
  });

  it('should display breadcrumbs for navigation', () => {
    cy.get('[data-testid="breadcrumbs"]', { timeout: 10000 }).should(
      'be.visible',
    );
  });

  it('should navigate back to home when clicking home in breadcrumbs', () => {
    cy.get('[data-testid="breadcrumbs"]', { timeout: 10000 })
      .contains(/home/i)
      .click();

    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
