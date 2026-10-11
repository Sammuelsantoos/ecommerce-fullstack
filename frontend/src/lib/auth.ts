import type { Role, User } from '@/types';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

function decodeJWT(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export const saveAuth = (token: string) => {
  localStorage.setItem('token', token);
  // Cookie espelho pro middleware/proxy do Next
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;

  // Extrai user do JWT
  const payload = decodeJWT(token);
  if (payload) {
    const user: User = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.email.split('@')[0],
    };
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  document.cookie = 'token=; path=/; max-age=0';
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as User) : null;
};

export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!getToken();
};
