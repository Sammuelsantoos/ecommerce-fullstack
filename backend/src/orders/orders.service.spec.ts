import { type AnyMock, mockFn } from '../../test/helpers/mock.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrdersService } from './orders.service.js';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    product: { findMany: AnyMock };
    order: { findMany: AnyMock };
    $transaction: AnyMock;
  };
  let tx: {
    product: { update: AnyMock };
    order: { create: AnyMock };
  };

  beforeEach(async () => {
    tx = {
      product: { update: mockFn().mockResolvedValue({}) },
      order: { create: mockFn().mockResolvedValue({ id: 'o1' }) },
    };
    prisma = {
      product: { findMany: mockFn() },
      order: { findMany: mockFn() },
      $transaction: mockFn().mockImplementation((cb: any) => cb(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  describe('create', () => {
    it('throws NotFoundException when a product does not exist', async () => {
      prisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);

      await expect(
        service.create('u1', {
          items: [
            { productId: 'p1', quantity: 1 },
            { productId: 'p2', quantity: 1 },
          ],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when stock is insufficient', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Mouse', price: '50.00', stock: 1 },
      ]);

      await expect(
        service.create('u1', { items: [{ productId: 'p1', quantity: 2 }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('computes the total, decrements stock and creates the order in a transaction', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Mouse', price: '50.00', stock: 10 },
        { id: 'p2', name: 'Teclado', price: '120.50', stock: 5 },
      ]);

      const result = await service.create('u1', {
        items: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 1 },
        ],
      });

      expect(result).toEqual({ id: 'o1' });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stock: { decrement: 2 } },
      });
      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: 'p2' },
        data: { stock: { decrement: 1 } },
      });
      const createArgs = tx.order.create.mock.calls[0][0];
      expect(createArgs.data.userId).toBe('u1');
      expect(createArgs.data.total).toBe(220.5);
      expect(createArgs.data.items.create).toEqual([
        { productId: 'p1', quantity: 2, price: 50 },
        { productId: 'p2', quantity: 1, price: 120.5 },
      ]);
    });
  });

  describe('findAllByUser', () => {
    it('filters by user and sorts newest first', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.findAllByUser('u1');

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findAll', () => {
    it('lists every order without filtering by user', async () => {
      prisma.order.findMany.mockResolvedValue([]);

      await service.findAll();

      const args = prisma.order.findMany.mock.calls[0][0];
      expect(args.where).toBeUndefined();
      expect(args.orderBy).toEqual({ createdAt: 'desc' });
    });
  });
});
