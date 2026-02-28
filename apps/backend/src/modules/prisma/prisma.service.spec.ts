import type { ConfigType } from '@nestjs/config';

import { mock } from 'jest-mock-extended';

import { appConfigs } from '../../app/configs/app.config';
import { PrismaService } from './prisma.service';

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    end: jest.fn(),
    query: jest.fn(),
  })),
}));
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({
    provider: 'postgres',
    startTransaction: jest.fn(),
    getConnectionInfo: jest.fn(),
  })),
}));

describe(PrismaService.name, () => {
  let uut: PrismaService;
  let mockAppConfig: ConfigType<typeof appConfigs>;

  beforeEach(async () => {
    mockAppConfig = mock<ConfigType<typeof appConfigs>>({
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    });

    uut = new PrismaService(mockAppConfig);

    // Mock the PrismaClient methods
    uut.$connect = jest.fn().mockResolvedValue(undefined);
    uut.$disconnect = jest.fn().mockResolvedValue(undefined);
  });

  it('should connect to the database on module init', async () => {
    await uut.onModuleInit();

    expect(uut.$connect).toHaveBeenCalledTimes(1);
  });

  it('should disconnect from the database on module destroy', async () => {
    await uut.onModuleDestroy();

    expect(uut.$disconnect).toHaveBeenCalledTimes(1);
  });
});
