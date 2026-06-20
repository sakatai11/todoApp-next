// app/providers/MSWProvider.tsx
'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mockingEnabled, setMockingEnabled] = useState(false);

  useEffect(() => {
    async function enableMocking() {
      // Only run on client side
      if (typeof window === 'undefined') {
        return;
      }

      if (
        process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
      ) {
        const { initMocks } = await import(
          '@/todoApp-submodule/mocks/initMocks'
        );
        await initMocks();
        setMockingEnabled(true);
      } else {
        setMockingEnabled(true);
      }
    }

    enableMocking();
  }, []);

  // Wait for MSW to initialize in development
  if (
    !mockingEnabled &&
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
  ) {
    return null;
  }

  return <>{children}</>;
}
