import type { User } from '@/types';

export const saveAuth = (token: string, user?: User) => {
  localStorage.setItem('token', token);
  // Cookie espelho pra middleware do Next
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
  if (user) localStorage.setItem('user', JSON.stringify(user));
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
