'use client';

import { useEffect, useState } from 'react';
import { getUser, isAuthenticated } from '@/lib/auth';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  return { user, loading, isAuth: isAuthenticated() };
}
