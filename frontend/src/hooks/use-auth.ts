'use client';

import { useEffect, useState } from 'react';
import { getUser, isAuthenticated } from '@/lib/auth';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setIsAuth(isAuthenticated());
    setMounted(true);
    setLoading(false);
  }, []);

  return { user, isAuth, loading, mounted };
}
