import { type AnyMock, mockFn } from '../../test/helpers/mock.js';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      create: AnyMock;
      findMany: AnyMock;
      count: AnyMock;
      findUnique: AnyMock;
      update: AnyMock;
      delete: AnyMock;
    };
  };

  beforeEach(async () => {
    prisma = {
      product: {
        create: mockFn(),
        findMany: mockFn(),
        count: mockFn(),
        findUnique: mockFn(),
        update: mockFn(),
        delete: mockFn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  describe('findAll', () => {
    it('uses default pagination and computes totalPages', async () => {
      prisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);
      prisma.product.count.mockResolvedValue(25);

      const result = await service.findAll({});

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {}, skip: 0, take: 10 }),
      );
      expect(result).toEqual({
        items: [{ id: 'p1' }],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
    });

    it('applies search (case-insensitive) and category filters with offset', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll({
        search: 'mouse',
        categoryId: 'c1',
        page: 3,
        limit: 5,
      });

      const where = {
        name: { contains: 'mouse', mode: 'insensitive' },
        categoryId: 'c1',
      };
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where, skip: 10, take: 5 }),
      );
      expect(prisma.product.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('findOne', () => {
    it('returns the product when it exists', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });

      await expect(service.findOne('p1')).resolves.toEqual({ id: 'p1' });
    });

    it('throws NotFoundException when it does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates an existing product', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.product.update.mockResolvedValue({ id: 'p1', stock: 3 });

      await service.update('p1', { stock: 3 });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stock: 3 },
      });
    });

    it('does not update when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('nope', { stock: 3 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes an existing product', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });

      await expect(service.remove('p1')).resolves.toEqual({
        message: 'Product deleted',
      });
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });

    it('does not delete when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });
  });
});
