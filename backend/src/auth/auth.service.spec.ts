import { type AnyMock, mockFn } from '../../test/helpers/mock.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: AnyMock; create: AnyMock } };
  let jwt: { signAsync: AnyMock };

  beforeEach(async () => {
    prisma = { user: { findUnique: mockFn(), create: mockFn() } };
    jwt = { signAsync: mockFn().mockResolvedValue('signed-token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    const dto = { name: 'Ana', email: 'ana@test.com', password: '123456' };

    it('creates the user with a hashed password and returns a token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        role: 'USER',
      });

      const result = await service.register(dto);

      expect(result).toEqual({ access_token: 'signed-token' });
      const data = prisma.user.create.mock.calls[0][0].data;
      expect(data.password).not.toBe(dto.password);
      expect(await bcrypt.compare(dto.password, data.password)).toBe(true);
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: dto.email,
        role: 'USER',
      });
    });

    it('throws ConflictException when the email is already in use', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'ana@test.com', password: '123456' };

    it('returns a token for valid credentials', async () => {
      const hash = await bcrypt.hash(dto.password, 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        role: 'ADMIN',
        password: hash,
      });

      await expect(service.login(dto)).resolves.toEqual({
        access_token: 'signed-token',
      });
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: dto.email,
        role: 'ADMIN',
      });
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const hash = await bcrypt.hash('another-password', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        role: 'USER',
        password: hash,
      });

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });
  });
});
