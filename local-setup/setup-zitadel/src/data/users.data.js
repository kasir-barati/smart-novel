// @ts-check

import { mkdir } from 'fs/promises';
import { join } from 'path';

import { zitadelDir } from '../services/index.js';

const userIdsDir = join(zitadelDir, 'user-ids');

await mkdir(userIdsDir, { recursive: true });

export const users = [
  {
    userInfo: {
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      password: 'Admin123!',
    },
    role: 'admin',
    userIdFile: join(userIdsDir, 'admin'),
  },
  {
    userInfo: {
      email: 'writer@test.com',
      firstName: 'Writer',
      lastName: 'User',
      password: 'Writer123!',
    },
    role: 'writer',
    userIdFile: join(userIdsDir, 'writer'),
  },
  {
    userInfo: {
      email: 'user@test.com',
      firstName: 'Regular',
      lastName: 'User',
      password: 'User123!',
    },
    role: 'user',
    userIdFile: join(userIdsDir, 'user'),
  },
];
