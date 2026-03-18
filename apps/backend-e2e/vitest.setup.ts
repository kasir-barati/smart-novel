import axios from 'axios';
import * as matchers from 'jest-extended';
import { expect } from 'vitest';

// Extend vitest matchers with jest-extended
expect.extend(matchers);

// Configure axios for tests to use.
const host = process.env.HOST ?? 'localhost';
const port = process.env.TRAEFIK_EXPOSED_PORT ?? '8080';
axios.defaults.baseURL = `http://${host}:${port}`;
