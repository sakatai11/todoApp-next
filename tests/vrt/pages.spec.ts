import { test, expect, Page } from '@playwright/test';

// VRT用の型定義
declare global {
  interface Window {
    __VRT_MOCK_AUTH__: boolean;
  }
}

/**
 * VRTテスト用の認証モックを設定するヘルパー関数
 * @param page Playwrightのページオブジェクト
 * @param user モックユーザー情報
 */
async function setupMockAuth(
  page: Page,
  user: { id: string; email: string; role: string },
) {
  // VRTテスト用のモック認証を設定
  await page.addInitScript((userData) => {
    // セッションストレージでモック認証状態を設定
    sessionStorage.setItem(
      'vrt-mock-auth',
      JSON.stringify({
        user: userData,
        authenticated: true,
      }),
    );

    // 認証APIをモック
    window.__VRT_MOCK_AUTH__ = true;
  }, user);

  // 既存の認証フローをスキップして、モックデータでAPIレスポンスを設定
  await page.route('**/api/auth/**', (route) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ user }),
    });
  });

  // general/admin を個別にフルURL対応のglobでモック
  for (const scope of ['general', 'admin'] as const) {
    await page.route(`**/api/${scope}/**`, (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], message: 'VRT Mock Response' }),
      });
    });
  }
}

test.describe('Visual Regression Testing - Pages', () => {
  test.beforeEach(async ({ page }) => {
    // 一貫したテスト環境のため、MSWを無効化し、アニメーションを無効化
    await page.addInitScript(() => {
      Object.defineProperty(window, 'msw', { value: undefined });

      // アニメーションを無効化するCSSを追加
      const style = document.createElement('style');
      style.textContent = `
        *,
        *::before,
        *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test('トップページ', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('top-page.png');
  });

  test('サインインページ', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('signin-page.png');
  });

  test('サインアップページ', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('signup-page.png');
  });

  test('Todoページ（ログイン後）', async ({ page }) => {
    // VRTテスト用のモック認証を設定
    await setupMockAuth(page, {
      id: 'vrt-test-user',
      email: 'vrt@test.com',
      role: 'USER',
    });

    // 認証エラーを無視してTodoページに直接移動
    await page.goto('/todo');
    await page.waitForLoadState('networkidle');

    // 主要なコンテンツ要素が読み込まれるまで待機
    await page.waitForSelector('body', { timeout: 10000 });

    // UIアニメーション完了を確実に待機
    await page.waitForFunction(
      () => {
        const elements = document.querySelectorAll(
          '.MuiCircularProgress-root, .loading',
        );
        return elements.length === 0;
      },
      { timeout: 5000 },
    );

    await expect(page).toHaveScreenshot('todo-page-after-login.png');
  });

  test('管理者ページ（管理者ログイン後）', async ({ page }) => {
    // VRTテスト用の管理者モック認証を設定
    await setupMockAuth(page, {
      id: 'vrt-admin-user',
      email: 'admin@vrt.com',
      role: 'ADMIN',
    });

    // 認証エラーを無視して管理者ページに直接移動
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // 管理者ページの主要なコンテンツ要素が読み込まれるまで待機
    await page.waitForSelector('body', { timeout: 10000 });

    // UIアニメーション完了を確実に待機
    await page.waitForFunction(
      () => {
        const elements = document.querySelectorAll(
          '.MuiCircularProgress-root, .loading',
        );
        return elements.length === 0;
      },
      { timeout: 5000 },
    );

    await expect(page).toHaveScreenshot('admin-page-after-login.png');
  });
});
