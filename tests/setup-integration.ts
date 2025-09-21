import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import React from 'react';

// 統合テスト用セットアップ - MSWを使用せず、Firebase Emulatorと直接通信

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn(),
    has: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  notFound: vi.fn(),
}));

// NextAuth.js の実際の動作に近いモック（統合テスト用）
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'test-user-1',
        email: 'test@example.com',
        role: 'user',
      },
    },
    status: 'authenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// NextAuth.js サーバーサイド認証のモック
vi.mock('@/auth', () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'test-user-1',
        email: 'test@example.com',
        role: 'user',
      },
    }),
  ),
}));

// 統合テスト環境用のブラウザAPIモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Firebase Emulator接続確認とテストデータ初期化
beforeAll(async () => {
  // Firebase Emulatorが利用可能になるまで待機
  const maxWaitTime = 30000; // 30秒
  const checkInterval = 1000; // 1秒間隔
  let elapsed = 0;

  console.log('Firebase Emulator接続確認を開始...');

  while (elapsed < maxWaitTime) {
    try {
      // Emulator UIへの接続テスト（ローカル環境では localhost を使用）
      const response = await fetch('http://localhost:4000');
      if (response.ok) {
        console.log('Firebase Emulator接続成功');
        break;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // 接続失敗時は待機を続行
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
    elapsed += checkInterval;
  }

  if (elapsed >= maxWaitTime) {
    console.warn('Firebase Emulator接続タイムアウト - テスト続行');
  }

  // Docker環境では既にinit-firebase-data.jsでデータ投入済みのため
  // ここでの初期化処理は不要
  console.log('Firebase Emulator接続確認完了 - データは既に投入済み');
});

afterEach(() => {
  // 統合テスト後のクリーンアップ
  vi.clearAllMocks();
});

afterAll(() => {
  // 最終クリーンアップ
  console.log('統合テスト環境クリーンアップ完了');
});
