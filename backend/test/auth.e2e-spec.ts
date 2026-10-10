import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from './setup-app.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register - should create user and return token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'John', email: 'john@test.com', password: '123456' })
      .expect(201);

    expect(res.body).toHaveProperty('access_token');
    expect(typeof res.body.access_token).toBe('string');
  });

  it('POST /api/auth/register - should return 409 on duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'John', email: 'john@test.com', password: '123456' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'John 2', email: 'john@test.com', password: '123456' })
      .expect(409);
  });

  it('POST /api/auth/register - should return 400 on invalid email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'John', email: 'not-an-email', password: '123456' })
      .expect(400);
  });

  it('POST /api/auth/register - should return 400 on short password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'John', email: 'john@test.com', password: '123' })
      .expect(400);
  });

  it('POST /api/auth/login - should return token with valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'John', email: 'john@test.com', password: '123456' });

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'john@test.com', password: '123456' })
      .expect(200);

    expect(res.body).toHaveProperty('access_token');
  });

  it('POST /api/auth/login - should return 401 with wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'John', email: 'john@test.com', password: '123456' });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'john@test.com', password: 'wrong' })
      .expect(401);
  });
});
