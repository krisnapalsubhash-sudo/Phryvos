'use client';

import { useEffect, useState } from 'react';

/**
 * Reusable hydration-aware hook to eliminate SSR / client hydration mismatches
 * Returns true only after component has mounted on the client.
 */
export function useHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
