import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAuth,
  getToken,
  getUser,
  isAuthenticated,
  saveAuth,
} from './auth';

function makeJwt(payload: Record<string, unknown>) {
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('auth helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'token=; path=/; max-age=0';
  });

  it('is unauthenticated when there is no token', () => {
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it('saves the token, mirrors it in a cookie and extracts the user from the JWT', () => {
    const token = makeJwt({
      sub: 'u1',
      email: 'admin@ecommerce.com',
      role: 'ADMIN',
    });

    saveAuth(token);

    expect(getToken()).toBe(token);
    expect(document.cookie).toContain(`token=${token}`);
    expect(getUser()).toEqual({
      id: 'u1',
      email: 'admin@ecommerce.com',
      role: 'ADMIN',
      name: 'admin',
    });
    expect(isAuthenticated()).toBe(true);
  });

  it('keeps the token but stores no user when the JWT payload is invalid', () => {
    saveAuth('not-a-jwt');

    expect(getToken()).toBe('not-a-jwt');
    expect(getUser()).toBeNull();
  });

  it('clears token, user and cookie on logout', () => {
    saveAuth(makeJwt({ sub: 'u1', email: 'a@b.com', role: 'USER' }));

    clearAuth();

    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
    expect(document.cookie).not.toContain('token=');
    expect(isAuthenticated()).toBe(false);
  });
});
