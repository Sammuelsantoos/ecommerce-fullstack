'use client';

import { useEffect, useState } from 'react';
import { getUser, isAuthenticated } from '@/lib/auth';

export function useAuth() {
  const [state, setState] = useState(() => ({
    mounted: typeof window !== 'undefined',
    user: typeof window !== 'undefined' ? getUser() : null,
    isAuth: typeof window !== 'undefined' ? isAuthenticated() : false,
  }));

  useEffect(() => {
    const syncState = () => {
      setState({
        mounted: true,
        user: getUser(),
        isAuth: isAuthenticated(),
      });
    };

    syncState();

    const handleAuthChange = () => syncState();
    window.addEventListener('auth:change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth:change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return {
    ...state,
    loading: false,
  };
}
