'use client';

import { useSyncExternalStore } from 'react';
import { getUser, isAuthenticated } from '@/lib/auth';

const emptySubscribe = () => () => {};

export function useAuth() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const user = useSyncExternalStore(
    emptySubscribe,
    () => getUser(),
    () => null
  );

  const isAuth = useSyncExternalStore(
    emptySubscribe,
    () => isAuthenticated(),
    () => false
  );

  return {
    user,
    isAuth,
    mounted,
    loading: false,
  };
}
