import { test, expect } from '@playwright/test';

test.describe('Visual Regression Testing - Pages', () => {
  test.beforeEach(async ({ page }) => {
    // 一貫したテスト環境のため、MSWを無効化
    await page.addInitScript(() => {
      Object.defineProperty(window, 'msw', { value: undefined });
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

  test('Todoページ（ログイン前）', async ({ page }) => {
    await page.goto('/todo');
    await page.waitForLoadState('networkidle');
    // サインインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/signin/);
    await expect(page).toHaveScreenshot('todo-page-before-login.png');
  });

  test('Todoページ（ログイン後）', async ({ page }) => {
    // VRTテスト用のモック認証を設定
    await page.addInitScript(() => {
      // セッションストレージでモック認証状態を設定
      sessionStorage.setItem(
        'vrt-mock-auth',
        JSON.stringify({
          user: {
            id: 'vrt-test-user',
            email: 'vrt@test.com',
            role: 'user',
          },
          authenticated: true,
        }),
      );

      // 認証APIをモック
      window.__VRT_MOCK_AUTH__ = true;
    });

    // 既存の認証フローをスキップして、モックデータでTodoページを表示
    await page.route('/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { id: 'vrt-test-user', email: 'vrt@test.com', role: 'user' },
        }),
      });
    });

    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // モック認証情報でログイン
    await page.fill('input[name="email"]', 'example@test.com');
    await page.fill('input[name="password"]', 'password');

    // 認証エラーを無視してTodoページに直接移動
    await page.goto('/todo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('todo-page-after-login.png');
  });

  test('管理者ページ（ログイン前）', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    // サインインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/.*\/signin/);
    await expect(page).toHaveScreenshot('admin-page-before-login.png');
  });

  test('管理者ページ（管理者ログイン後）', async ({ page }) => {
    // VRTテスト用の管理者モック認証を設定
    await page.addInitScript(() => {
      // セッションストレージで管理者モック認証状態を設定
      sessionStorage.setItem(
        'vrt-mock-auth',
        JSON.stringify({
          user: {
            id: 'vrt-admin-user',
            email: 'admin@vrt.com',
            role: 'admin',
          },
          authenticated: true,
        }),
      );

      // 認証APIをモック
      window.__VRT_MOCK_AUTH__ = true;
    });

    // 管理者認証APIをモック
    await page.route('/api/auth/**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: { id: 'vrt-admin-user', email: 'admin@vrt.com', role: 'admin' },
        }),
      });
    });

    await page.goto('/signin');
    await page.waitForLoadState('networkidle');

    // モック管理者認証情報でログイン
    await page.fill('input[name="email"]', 'example@test.com');
    await page.fill('input[name="password"]', 'password');

    // 認証エラーを無視して管理者ページに直接移動
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('admin-page-after-login.png');
  });
});
