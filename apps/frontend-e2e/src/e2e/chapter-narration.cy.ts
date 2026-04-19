describe('Chapter Audio Narration', () => {
  const NOVEL_ID = 'c1d31ec2-f478-4648-b90b-d1e53de2a829';
  const CHAPTER_ID = '4dd92f16-4743-47b9-960c-6529678e9bc5';
  const NOVEL_URL = `/novel/${NOVEL_ID}`;
  const CHAPTER_URL = `${NOVEL_URL}?chapter=${CHAPTER_ID}`;

  /**
   * Navigate directly to a chapter page as an authenticated writer. The `?chapter=` query param causes the page to load the chapter content directly (no chapter list).
   */
  function visitChapterAsWriter() {
    cy.login();
    cy.intercept('POST', '**/graphql').as('graphql');
    cy.visit(CHAPTER_URL);
    cy.wait('@graphql');

    // The chapter content loads automatically — wait for it
    cy.get('.prose-container', { timeout: 15000 }).should(
      'be.visible',
    );
  }

  /**
   * Set up a GraphQL intercept that modifies the chapter response, then visit the chapter URL and wait for chapter content.
   */
  function visitChapterWithMock(
    chapterOverrides: Record<string, unknown>,
  ) {
    cy.login();

    cy.intercept('POST', '**/graphql', (req) => {
      req.continue((res) => {
        if (res.body?.data?.novel?.chapter) {
          Object.assign(
            res.body.data.novel.chapter,
            chapterOverrides,
          );
        }
      });
    }).as('graphqlMocked');

    cy.visit(CHAPTER_URL);
    cy.wait('@graphqlMocked');

    // Chapter content loads automatically via `?chapter=` param
    cy.get('.prose-container', { timeout: 15000 }).should(
      'be.visible',
    );
  }

  describe('Writer Tools section', () => {
    it('should display the Writer Tools section for authenticated writers', () => {
      visitChapterAsWriter();

      cy.contains('Writer Tools', { timeout: 10000 }).should(
        'be.visible',
      );
    });

    it('should display the Generate Audio button', () => {
      visitChapterAsWriter();

      // The button text is either "Generate Audio" or "Regenerate Audio"
      cy.get('body').should(($body) => {
        const text = $body.text();
        const hasGenerate = text.includes('Generate Audio');
        const hasRegenerate = text.includes('Regenerate Audio');
        expect(
          hasGenerate || hasRegenerate,
          'Should show either Generate Audio or Regenerate Audio button',
        ).to.equal(true);
      });
    });

    it('should display the Generate TTS button', () => {
      visitChapterAsWriter();

      cy.get('body').should(($body) => {
        const text = $body.text();
        const hasGenerateTts = text.includes('Generate TTS');
        const hasEditTts = text.includes('Edit TTS Content');
        expect(
          hasGenerateTts || hasEditTts,
          'Should show either Generate TTS or Edit TTS Content button',
        ).to.equal(true);
      });
    });
  });

  describe('Audio narration with mocked GraphQL responses', () => {
    it('should show audio player when chapter has narration URL', () => {
      visitChapterWithMock({
        narrationStatus: 'READY',
        narrationUrl: 'https://example.com/test-narration.mp3',
      });

      // Audio Narration section should be visible
      cy.contains('Audio Narration', { timeout: 10000 }).should(
        'be.visible',
      );

      // Audio element should exist
      cy.get('audio[controls]').should('exist');
    });

    it('should show "Regenerate Audio" when narration already exists', () => {
      visitChapterWithMock({
        narrationStatus: 'READY',
        narrationUrl: 'https://example.com/test-narration.mp3',
        ttsFriendlyContent: 'Some TTS content',
      });

      cy.contains('Regenerate Audio', { timeout: 10000 }).should(
        'be.visible',
      );
    });

    it('should show confirmation modal when clicking Regenerate Audio', () => {
      visitChapterWithMock({
        narrationStatus: 'READY',
        narrationUrl: 'https://example.com/test-narration.mp3',
        ttsFriendlyContent: 'Some TTS content',
      });

      // Click Regenerate Audio
      cy.contains('button', 'Regenerate Audio', {
        timeout: 10000,
      }).click();

      // Modal should appear
      cy.contains('h3', 'Regenerate Audio Narration?').should(
        'be.visible',
      );
      cy.contains('button', 'Cancel').should('be.visible');
      cy.contains('button', 'Yes, Regenerate').should('be.visible');
    });

    it('should close confirmation modal when clicking Cancel', () => {
      visitChapterWithMock({
        narrationStatus: 'READY',
        narrationUrl: 'https://example.com/test-narration.mp3',
        ttsFriendlyContent: 'Some TTS content',
      });

      // Open modal
      cy.contains('button', 'Regenerate Audio', {
        timeout: 10000,
      }).click();
      cy.contains('h3', 'Regenerate Audio Narration?').should(
        'be.visible',
      );

      // Click Cancel
      cy.contains('button', 'Cancel').click();

      // Modal should disappear
      cy.contains('h3', 'Regenerate Audio Narration?').should(
        'not.exist',
      );
    });

    it('should show error state with retry link when narration fails', () => {
      visitChapterWithMock({
        narrationStatus: 'FAILED',
        narrationUrl: null,
        ttsFriendlyContent: 'Some TTS content',
      });

      cy.contains('Audio generation failed.', {
        timeout: 10000,
      }).should('be.visible');
      cy.contains('button', 'Retry').should('be.visible');
    });

    it('should disable Generate Audio button when no TTS-friendly content exists', () => {
      visitChapterWithMock({
        narrationStatus: null,
        narrationUrl: null,
        ttsFriendlyContent: null,
      });

      cy.contains('button', 'Generate Audio', { timeout: 10000 })
        .should('be.visible')
        .and('be.disabled');
    });
  });

  describe('Full flow: generate TTS content → generate audio → audio player', () => {
    /**
     * This is a slow integration test that exercises the full narration flow
     * against the real backend services (Ollama for TTS normalization,
     * TTS service for audio generation, MinIO for storage).
     *
     * Timeouts are generous to account for:
     * - TTS-friendly content generation via LLM (~30-60s)
     * - Audio generation via TTS service (~30-120s)
     * - S3 upload and DB update (~5s)
     */
    it('should generate TTS content, then generate audio, and display the audio player', () => {
      cy.login();
      cy.intercept('POST', '**/graphql').as('graphql');

      // Step 1: Navigate to the novel page (chapter list view)
      cy.visit(NOVEL_URL);
      cy.wait('@graphql');

      // Step 2: Click on the first chapter from the chapter list
      cy.contains('Chapter 1', { timeout: 10000 }).first().click();
      cy.wait('@graphql');

      // Wait for chapter content
      cy.get('.prose-container', { timeout: 15000 }).should(
        'be.visible',
      );

      // Step 3: Check if TTS-friendly content already exists.
      // If "Edit TTS Content" is visible, TTS content exists already.
      // If "Generate TTS" is visible, we need to generate it first.
      cy.get('body').then(($body) => {
        const needsTtsGeneration =
          $body.text().includes('Generate TTS') &&
          !$body.text().includes('Edit TTS Content');

        if (needsTtsGeneration) {
          cy.task(
            'log',
            'TTS content not found — generating via TTS review page...',
          );

          // Click "Generate TTS" to navigate to TTS review page
          cy.contains('button', 'Generate TTS').click();

          // Wait for TTS review page to load and content to generate
          cy.url().should('include', '/tts-review');

          // Wait for the TTS content to be generated (LLM processing)
          // The page will show "Generating TTS-friendly content..." then the review view
          cy.contains('h1', 'TTS Content Review', {
            timeout: 120000,
          }).should('be.visible');

          // Click "Confirm & Save" to save the TTS-friendly content
          cy.contains('button', 'Confirm & Save').first().click();

          // Should navigate back to the novel page
          cy.url({ timeout: 10000 }).should('include', NOVEL_URL);
          cy.url().should('not.include', 'tts-review');

          // Re-open the chapter from the chapter list
          cy.contains('Chapter 1', { timeout: 10000 })
            .first()
            .click();
          cy.wait('@graphql');

          cy.get('.prose-container', { timeout: 15000 }).should(
            'be.visible',
          );
        } else {
          cy.task(
            'log',
            'TTS content already exists — skipping TTS generation.',
          );
        }
      });

      // Step 4: Now the chapter should have TTS-friendly content.
      // The button should show either "Generate Audio" or "Regenerate Audio".
      cy.get('body', { timeout: 10000 }).then(($body) => {
        const hasExistingNarration = $body
          .text()
          .includes('Regenerate Audio');

        if (hasExistingNarration) {
          cy.task(
            'log',
            'Narration already exists — clicking Regenerate Audio...',
          );

          // Click Regenerate Audio → confirmation modal → Yes, Regenerate
          cy.contains('button', 'Regenerate Audio').click();
          cy.contains('h3', 'Regenerate Audio Narration?').should(
            'be.visible',
          );
          cy.contains('button', 'Yes, Regenerate').click();
        } else {
          cy.task(
            'log',
            'No narration yet — clicking Generate Audio...',
          );
          cy.contains('button', 'Generate Audio', {
            timeout: 10000,
          }).click();
        }
      });

      // Step 5: Verify processing spinner appears
      cy.contains('Generating audio...', { timeout: 10000 }).should(
        'be.visible',
      );

      cy.task(
        'log',
        'Audio generation in progress — waiting for completion (up to 3 minutes)...',
      );

      // Step 6: Wait for the audio player to appear.
      // The subscription will update the UI when generation completes.
      // Using a generous timeout for the full TTS → S3 upload pipeline.
      cy.contains('Audio Narration', { timeout: 180000 }).should(
        'be.visible',
      );

      // Step 7: Verify the audio element is present and has controls
      cy.get('audio[controls]').should('exist');
      cy.get('audio[controls]')
        .should('have.attr', 'src')
        .and('include', '.mp3');

      // Step 8: After narration is generated, the button should now say "Regenerate Audio"
      cy.contains('button', 'Regenerate Audio').should('be.visible');

      cy.task(
        'log',
        'Audio narration generated and player is visible — test passed!',
      );
    });
  });
});
