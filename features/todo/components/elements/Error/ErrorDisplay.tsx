'use client';

import React from 'react';

type ErrorDisplayProps = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[50vh]">
      <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-4">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-medium text-gray-900 mb-2">
        エラーが発生しました
      </h2>
      <p className="text-gray-600 text-center mb-4">{message}</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={handleRetry}
      >
        再読み込み
      </button>
    </div>
  );
}
