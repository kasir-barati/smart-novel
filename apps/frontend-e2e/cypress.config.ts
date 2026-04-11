import { defineConfig } from 'cypress';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOGS_DIR = join(__dirname, 'cypress', 'logs');

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'src/e2e/**/*.cy.ts',
    supportFile: 'src/support/e2e.ts',
    fixturesFolder: 'src/fixtures',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on) {
      mkdirSync(LOGS_DIR, { recursive: true });

      on('task', {
        log(message: string) {
          const timestamp = new Date().toISOString();
          const line = `[${timestamp}] ${message}\n`;
          const logFile = join(LOGS_DIR, 'cypress-debug.log');

          appendFileSync(logFile, line);

          // Also print to the terminal
          console.log(line.trimEnd());

          return null;
        },
      });
    },
  },
});
