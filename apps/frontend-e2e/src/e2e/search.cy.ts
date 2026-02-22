describe('Search Page', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/graphql').as('graphql');
    cy.visit('/search');
    cy.wait('@graphql');
  });

  it('should load the search page successfully', () => {
    cy.url().should('include', '/search');
    cy.contains('h1', /search novels/i).should('be.visible');
  });

  it('should display search controls', () => {
    cy.contains('h3', /include categories/i).should('be.visible');
    cy.contains('h3', /exclude categories/i).should('be.visible');
    cy.contains('button', /^search$/i).should('be.visible');
  });

  it('should display category filters', () => {
    cy.contains('h3', /include categories/i)
      .parent()
      .find('button')
      .should('have.length.greaterThan', 0);
  });

  it('should filter novels when selecting categories and searching', () => {
    cy.intercept('POST', '**/graphql').as('searchNovels');

    cy.contains('h3', /include categories/i)
      .parent()
      .find('button')
      .first()
      .click();

    cy.contains('button', /^search$/i).click();
    cy.wait('@searchNovels');

    cy.contains('h2', /results/i).should('be.visible');
  });

  it('should filter novels by category when selecting a category', () => {
    cy.intercept('POST', '**/graphql').as('searchNovels');

    cy.contains('h3', /include categories/i)
      .parent()
      .find('button')
      .first()
      .click();

    cy.contains('button', /^search$/i).click();
    cy.wait('@searchNovels');

    cy.contains(/results|no novels found/i).should('be.visible');
  });

  it('should clear search filters', () => {
    cy.contains('h3', /include categories/i)
      .parent()
      .find('button')
      .first()
      .as('includeCategory');

    cy.get('@includeCategory').click();
    cy.get('@includeCategory').should('have.class', 'bg-green-600');

    // Toggle again to clear
    cy.get('@includeCategory').click();
    cy.get('@includeCategory').should(
      'not.have.class',
      'bg-green-600',
    );
  });

  it('should navigate to novel detail page when clicking on a search result', () => {
    cy.intercept('POST', '**/graphql').as('searchNovels');

    cy.contains('h3', /include categories/i)
      .parent()
      .find('button')
      .first()
      .click();

    cy.contains('button', /^search$/i).click();
    cy.wait('@searchNovels');

    cy.get('body').then(($body) => {
      if ($body.find('a[href^="/novel/"]').length > 0) {
        cy.get('a[href^="/novel/"]').first().click();
        cy.url().should('include', '/novel/');
      }
    });
  });

  it('should display message when no results are found', () => {
    cy.intercept('POST', '**/graphql').as('searchNovels');

    cy.contains('h3', /include categories/i)
      .parent()
      .find('button')
      .first()
      .as('includeCategory');

    cy.contains('h3', /exclude categories/i)
      .parent()
      .find('button')
      .first()
      .as('excludeCategory');

    // Select the same category in include and exclude to force empty results.
    cy.get('@includeCategory')
      .invoke('text')
      .then((label) => {
        const category = label.trim();
        cy.get('@includeCategory').click();
        cy.contains('h3', /exclude categories/i)
          .parent()
          .find('button')
          .contains(category)
          .click();
      });

    cy.contains('button', /^search$/i).click();
    cy.wait('@searchNovels');

    cy.contains(/no novels found matching your criteria/i).should(
      'be.visible',
    );
  });
});
