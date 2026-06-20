// app/components/MockIndicator.tsx
'use client';

export function MockIndicator() {
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled'
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-md shadow-lg z-50">
      <p className="text-sm font-semibold">🔧 Mock Mode</p>
      <p className="text-xs">Email: example@test.com</p>
      <p className="text-xs">Pass: password</p>
    </div>
  );
}
