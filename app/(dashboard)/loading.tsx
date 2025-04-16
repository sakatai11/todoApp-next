import React from 'react';

export default function TodosLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-screen">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-md text-gray-600">読み込み中...</p>
    </div>
  );
}
