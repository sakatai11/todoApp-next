import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-700">読み込み中...</p>
    </div>
  );
}
