import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from './setup-app.js';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let productId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Admin
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: '123456' });
    await prisma.user.update({
      where: { email: 'admin@test.com' },
      data: { role: 'ADMIN' },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: '123456' });
    adminToken = adminLogin.body.access_token;

    // User
    const userReg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'User', email: 'user@test.com', password: '123456' });
    userToken = userReg.body.access_token;

    // Categoria + produto
    const cat = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Eletrônicos', slug: 'eletronicos' });

    const prod = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'iPhone 15',
        description: 'Smartphone',
        price: 5999.9,
        stock: 10,
        categoryId: cat.body.id,
      });
    productId = prod.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/orders - should return 401 without token', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .send({ items: [{ productId, quantity: 1 }] })
      .expect(401);
  });

  it('POST /api/orders - should create order and decrement stock', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ productId, quantity: 2 }] })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(Number(res.body.total)).toBeCloseTo(11999.8, 2);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(8);
  });

  it('POST /api/orders - should return 400 on insufficient stock', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ productId, quantity: 999 }] })
      .expect(400);
  });

  it('POST /api/orders - should return 404 on invalid product', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ productId: 'fake-id', quantity: 1 }] })
      .expect(404);
  });

  it('GET /api/orders/me - should return only my orders', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ productId, quantity: 1 }] });

    const res = await request(app.getHttpServer())
      .get('/api/orders/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].items).toHaveLength(1);
  });

  it('GET /api/orders - should return 403 for non-admin', async () => {
    await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('GET /api/orders - should return all orders for admin', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [{ productId, quantity: 1 }] });

    const res = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
  });
});
