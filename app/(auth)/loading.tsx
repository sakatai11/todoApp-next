import React from 'react';

export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-md text-gray-700">認証処理中...</p>
    </div>
  );
}
