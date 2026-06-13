import { test, expect } from '@playwright/test';
import { signInAndOpenBoard, listTitleBox } from './helpers';

// spec: tests/e2e/E2E_TEST_PLAN.md
// テストプラン: 7. レスポンシブデザイン（Medium）

const CATEGORIES = ['in-progress', 'done', 'todo'];

test.describe('レスポンシブデザイン（Medium）', () => {
  test('7.1 モバイル表示の確認', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await signInAndOpenBoard(page);

    // モバイルでも全リストとアクション要素が表示される
    for (const category of CATEGORIES) {
      await expect(listTitleBox(page, category)).toBeVisible();
    }
    await expect(page.getByRole('button', { name: '新規作成' })).toBeVisible();
    await expect(
      page.getByText('Next.js App Routerの学習', { exact: true }),
    ).toBeVisible();
  });

  test('7.2 タブレット表示の確認', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await signInAndOpenBoard(page);

    // タブレットでも全リストが表示され機能が利用できる
    for (const category of CATEGORIES) {
      await expect(listTitleBox(page, category)).toBeVisible();
    }
    await expect(
      page.getByRole('button', { name: 'TODOを追加する' }).first(),
    ).toBeVisible();
  });

  test('7.3 デスクトップ（大画面）表示の確認', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await signInAndOpenBoard(page);

    // 大画面でも全リストとタスクが表示される
    for (const category of CATEGORIES) {
      await expect(listTitleBox(page, category)).toBeVisible();
    }
    await expect(
      page.getByText('TypeScript最適化', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '新規作成' })).toBeVisible();
  });
});
