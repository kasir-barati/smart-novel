import axios from 'axios';
import { config } from 'dotenv';
import * as matchers from 'jest-extended';
import path from 'node:path';
import { expect } from 'vitest';

const workspaceRoot = path.resolve(__dirname, '../../');

config({ path: path.join(workspaceRoot, '.env') });
expect.extend(matchers);

const host = process.env.HOST ?? 'localhost';
const port = process.env.TRAEFIK_EXPOSED_PORT ?? '8080';
axios.defaults.baseURL = `http://${host}:${port}`;
