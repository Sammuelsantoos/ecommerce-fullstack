import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from './setup-app.js';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let categoryId: string;

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

    // Cria admin
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

    // Cria user comum
    const userReg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'User', email: 'user@test.com', password: '123456' });
    userToken = userReg.body.access_token;

    // Cria categoria
    const cat = await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Eletrônicos', slug: 'eletronicos' });
    categoryId = cat.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const validProduct = () => ({
    name: 'iPhone 15',
    description: 'Smartphone',
    price: 5999.9,
    stock: 10,
    categoryId,
  });

  it('GET /api/products - should return empty list initially', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/products')
      .expect(200);

    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('POST /api/products - should return 401 without token', async () => {
    await request(app.getHttpServer())
      .post('/api/products')
      .send(validProduct())
      .expect(401);
  });

  it('POST /api/products - should return 403 for non-admin', async () => {
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validProduct())
      .expect(403);
  });

  it('POST /api/products - should create product as admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProduct())
      .expect(201);

    expect(res.body.name).toBe('iPhone 15');
    expect(res.body.stock).toBe(10);
  });

  it('GET /api/products - should support search filter', async () => {
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProduct());

    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validProduct(), name: 'Galaxy S24' });

    const res = await request(app.getHttpServer())
      .get('/api/products?search=iPhone')
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].name).toBe('iPhone 15');
  });

  it('DELETE /api/products/:id - should delete as admin', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validProduct());

    await request(app.getHttpServer())
      .delete(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/products/${created.body.id}`)
      .expect(404);
  });
});
