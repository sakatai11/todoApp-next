// mocks/initMocks.ts

export async function initMocks() {
  if (typeof window === 'undefined') {
    // Server-side - Only run in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
      const { server } = await import('./server');
      server.listen({
        onUnhandledRequest: 'bypass',
      });
      console.log('MSW: Server-side mocking enabled');
    }
  } else {
    // Client-side
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
      const { worker } = await import('./browser');
      await worker.start({
        onUnhandledRequest: 'bypass', // Bypass unhandled requests
      });
      console.log('MSW: Client-side mocking enabled');
    }
  }
}
