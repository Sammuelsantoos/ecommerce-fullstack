import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { saveAuth, clearAuth } from '@/lib/auth';
import { useAuth } from './use-auth';

const makeJwt = ({
  sub,
  email,
  role,
}: {
  sub: string;
  email: string;
  role: 'USER' | 'ADMIN';
}) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({ sub, email, role, iat: 1700000000, exp: 1800000000 }),
  );
  return `${header}.${payload}.signature`;
};

describe('useAuth', () => {
  beforeEach(() => {
    clearAuth();
  });

  it('does not trigger infinite re-renders when auth is loaded from localStorage', () => {
    saveAuth(makeJwt({ sub: 'u1', email: 'user@example.com', role: 'USER' }));

    const container = document.createElement('div');
    const root = createRoot(container);
    const renderCount = { value: 0 };

    function Probe() {
      const auth = useAuth();
      renderCount.value += 1;
      return <div>{auth.user?.email ?? 'anon'}</div>;
    }

    expect(() => {
      act(() => {
        root.render(<Probe />);
      });
    }).not.toThrow();

    expect(container.textContent).toContain('user@example.com');
    expect(renderCount.value).toBeLessThan(20);
  });
});
