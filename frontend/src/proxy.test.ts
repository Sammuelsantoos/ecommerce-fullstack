import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { config, proxy } from './proxy';

const run = (url: string, cookie?: string) =>
  proxy(
    new NextRequest(url, {
      headers: cookie ? { cookie } : undefined,
    }),
  );

describe('proxy (route protection)', () => {
  it.each(['/checkout', '/orders', '/admin'])(
    'redirects %s to /login with ?redirect when there is no token',
    (path) => {
      const res = run(`http://localhost:3000${path}`);

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get('location')!);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('redirect')).toBe(path);
    },
  );

  it('lets protected routes through when the token cookie exists', () => {
    const res = run('http://localhost:3000/admin', 'token=abc');

    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('only matches the protected routes', () => {
    expect(config.matcher).toEqual([
      '/checkout/:path*',
      '/orders/:path*',
      '/admin/:path*',
    ]);
  });
});
