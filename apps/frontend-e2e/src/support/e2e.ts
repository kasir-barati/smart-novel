// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';
import { log } from './logger';

beforeEach(function () {
  const testTitle = (this as Mocha.Context).currentTest?.fullTitle();
  log(`\n>>> TEST START: ${testTitle}`);
});

afterEach(function () {
  const test = (this as Mocha.Context).currentTest;
  const status = test?.state ?? 'unknown';
  const title = test?.fullTitle();
  log(`<<< TEST END: ${title} — ${status.toUpperCase()}`);
});
