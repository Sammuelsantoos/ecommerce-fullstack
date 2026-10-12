import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mockFn, type AnyMock } from '../../test/helpers/mock.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: AnyMock };

  beforeEach(async () => {
    prisma = { $queryRaw: mockFn() };
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('returns ok when the database answers', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      db: 'up',
    });
  });

  it('throws ServiceUnavailableException when the database is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
