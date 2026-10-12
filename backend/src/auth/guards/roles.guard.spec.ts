import { type AnyMock, mockFn } from '../../../test/helpers/mock.js';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';

function contextWithUser(user?: { role: string }) {
  return {
    getHandler: () => () => undefined,
    getClass: () => class Dummy {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: AnyMock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: mockFn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows access when the route has no required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextWithUser({ role: 'USER' }))).toBe(true);
  });

  it('allows access when the user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(contextWithUser({ role: 'ADMIN' }))).toBe(true);
  });

  it('denies access when the user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(contextWithUser({ role: 'USER' }))).toBe(false);
  });

  it('denies access when there is no authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(contextWithUser(undefined))).toBe(false);
  });
});
