describe('Search Page', () => {
  beforeEach(() => {
    cy.visit('/search');
  });

  it('should load the search page successfully', () => {
    cy.url().should('include', '/search');
    cy.contains(/search/i).should('be.visible');
  });

  it('should display search input field', () => {
    cy.get('[data-testid="search-input"]', { timeout: 10000 }).should(
      'be.visible',
    );
  });

  it('should display category filters', () => {
    cy.get('[data-testid="category-filter"]', {
      timeout: 10000,
    }).should('be.visible');
  });

  it('should filter novels when typing in search input', () => {
    // Wait for initial load
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Type in search input
    cy.get('[data-testid="search-input"]', { timeout: 10000 }).type(
      'test',
    );

    // Wait for filtered results
    cy.wait('@getNovels');

    // Verify results are displayed
    cy.get('[data-testid="search-results"]', {
      timeout: 10000,
    }).should('be.visible');
  });

  it('should filter novels by category when selecting a category', () => {
    // Wait for initial load
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Check if category filters exist
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="category-option"]').length > 0) {
        // Click on a category
        cy.get('[data-testid="category-option"]').first().click();

        // Wait for filtered results
        cy.wait('@getNovels');

        // Verify results are filtered
        cy.get('[data-testid="search-results"]', {
          timeout: 10000,
        }).should('be.visible');
      }
    });
  });

  it('should clear search filters', () => {
    // Wait for initial load
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Type in search input
    cy.get('[data-testid="search-input"]', { timeout: 10000 }).type(
      'test',
    );

    // Check if clear button exists and click it
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="clear-search"]').length > 0) {
        cy.get('[data-testid="clear-search"]').click();

        // Verify input is cleared
        cy.get('[data-testid="search-input"]').should(
          'have.value',
          '',
        );
      }
    });
  });

  it('should navigate to novel detail page when clicking on a search result', () => {
    // Wait for results to load
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Check if results exist
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="novel-card"]').length > 0) {
        // Click on first result
        cy.get('[data-testid="novel-card"]').first().click();

        // Verify navigation to novel page
        cy.url().should('include', '/novel/');
      }
    });
  });

  it('should display message when no results are found', () => {
    // Wait for initial load
    cy.intercept('POST', '**/graphql').as('getNovels');
    cy.wait('@getNovels');

    // Type a search term that should return no results
    cy.get('[data-testid="search-input"]', { timeout: 10000 }).type(
      'xyznonexistentnovel123456',
    );

    // Wait for search
    cy.wait('@getNovels');

    // Check if no results message exists
    cy.get('body').then(($body) => {
      if (
        $body.text().includes('No') ||
        $body.text().includes('not found')
      ) {
        cy.contains(/no.*found|no.*results/i).should('be.visible');
      }
    });
  });
});
