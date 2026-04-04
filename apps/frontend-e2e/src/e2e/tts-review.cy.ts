describe('TTS Review Page', () => {
  const NOVEL_ID = 'c1d31ec2-f478-4648-b90b-d1e53de2a829';
  const CHAPTER_ID = '4dd92f16-4743-47b9-960c-6529678e9bc5';
  const TTS_REVIEW_URL = `/novel/${NOVEL_ID}/chapter/${CHAPTER_ID}/tts-review`;

  it('should show loading spinner while generating TTS content', () => {
    cy.login();

    cy.visit(TTS_REVIEW_URL);

    cy.contains('Generating TTS-friendly content...').should(
      'be.visible',
    );

    // cy.logout();
  });

  it('should display the review page with header and labels', () => {
    cy.login();
    cy.visit(TTS_REVIEW_URL);

    // Header
    cy.contains('h1', 'TTS Content Review').should('be.visible');
    cy.contains('Review and edit the generated TTS-friendly').should(
      'be.visible',
    );

    // Pane labels
    cy.contains('Current TTS Content (read-only)').should(
      'be.visible',
    );
    cy.contains('New TTS Content (editable)').should('be.visible');

    // cy.logout();
  });

  it('should display Cancel and Confirm & Save buttons', () => {
    cy.login();
    cy.visit(TTS_REVIEW_URL);

    // Both header and bottom action bars have these buttons
    cy.contains('button', 'Cancel').should('be.visible');
    cy.contains('button', 'Confirm & Save').should('be.visible');

    // cy.logout();
  });

  it('should display font size controls', () => {
    cy.login();
    cy.visit(TTS_REVIEW_URL);

    cy.get('button[aria-label="Decrease font size"]').should(
      'be.visible',
    );
    cy.get('button[aria-label="Increase font size"]').should(
      'be.visible',
    );
    cy.contains('14px').should('be.visible');
    // cy.logout();
  });

  it('should increase font size when clicking the + button', () => {
    cy.login();
    cy.visit(TTS_REVIEW_URL);

    cy.contains('14px').should('be.visible');
    cy.get('button[aria-label="Increase font size"]').click();
    cy.contains('16px').should('be.visible');
    // cy.logout();
  });

  it('should decrease font size when clicking the − button', () => {
    cy.login();
    cy.visit(TTS_REVIEW_URL);

    // First increase, then decrease back
    cy.get('button[aria-label="Increase font size"]').click();
    cy.contains('16px').should('be.visible');

    cy.get('button[aria-label="Decrease font size"]').click();
    cy.contains('14px').should('be.visible');
    // cy.logout();
  });

  it('should navigate back to novel page when clicking Cancel', () => {
    cy.login();
    cy.visit(TTS_REVIEW_URL);

    cy.contains('button', 'Cancel').first().click();

    cy.url().should('include', `/novel/${NOVEL_ID}`);
    cy.url().should('not.include', 'tts-review');
    // cy.logout();
  });

  it('should save and navigate back when clicking Confirm & Save', () => {
    cy.login();
    cy.visit(TTS_REVIEW_URL);

    cy.contains('button', 'Confirm & Save').first().click();

    // Should navigate to the novel page after saving
    cy.url({ timeout: 10000 }).should(
      'include',
      `/novel/${NOVEL_ID}`,
    );
    cy.url().should('not.include', 'tts-review');
    // cy.logout();
  });

  it('should show error state when API calls fail', () => {
    cy.intercept('POST', '**/graphql', {
      statusCode: 500,
      body: { errors: [{ message: 'Internal Server Error' }] },
    }).as('graphqlError');

    cy.visit(TTS_REVIEW_URL);

    cy.contains('Failed to generate TTS-friendly content', {
      timeout: 10000,
    }).should('be.visible');
    cy.contains('button', '← Back to Novel').should('be.visible');
    // cy.logout();
  });

  it('should navigate back from error state when clicking Back to Novel', () => {
    cy.intercept('POST', '**/graphql', {
      statusCode: 500,
      body: { errors: [{ message: 'Internal Server Error' }] },
    }).as('graphqlError');

    cy.visit(TTS_REVIEW_URL);

    cy.contains('button', '← Back to Novel', {
      timeout: 10000,
    }).click();

    cy.url().should('include', `/novel/${NOVEL_ID}`);
    cy.url().should('not.include', 'tts-review');
    // cy.logout();
  });

  it('should render the CodeMirror merge view', () => {
    cy.login();

    cy.visit(TTS_REVIEW_URL);

    // The merge view is inside a bordered container
    cy.get('.cm-mergeView', { timeout: 10000 }).should('exist');
    // cy.logout();
  });
});

it('should show Generate TTS buttons on the novel chapter list', () => {
  cy.intercept('POST', '**/graphql').as('graphql');

  // Navigate to a novel from the home page
  cy.get('a[href^="/novel/"]', { timeout: 10000 }).first().click();
  cy.url().should('include', '/novel/');
  cy.wait('@graphql');

  // Writer should see the Generate TTS button on chapters
  cy.contains('button', 'Generate TTS', {
    timeout: 10000,
  }).should('be.visible');
});

it('should navigate to TTS review page from Generate TTS button', () => {
  cy.intercept('POST', '**/graphql').as('graphql');

  // Navigate to a novel
  cy.get('a[href^="/novel/"]', { timeout: 10000 }).first().click();
  cy.url().should('include', '/novel/');
  cy.wait('@graphql');

  // Click "Generate TTS" on the first chapter
  cy.contains('button', 'Generate TTS', { timeout: 10000 })
    .first()
    .click();

  // Should be on the TTS review page
  cy.url().should('include', '/tts-review');

  // The page will show either the loading spinner, the review content,
  // or an error — depending on how fast the real API responds.
  // We just verify we landed on a recognisable TTS review state.
  cy.get('body', { timeout: 15000 }).should(($body) => {
    const text = $body.text();
    const hasLoading = text.includes(
      'Generating TTS-friendly content',
    );
    const hasReview = text.includes('TTS Content Review');
    const hasError = text.includes(
      'Failed to generate TTS-friendly content',
    );
    expect(
      hasLoading || hasReview || hasError,
      'Page should show loading, review content, or error state',
    ).to.equal(true);
  });
});
