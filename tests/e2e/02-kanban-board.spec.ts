import { test, expect } from '@playwright/test';
import { signInAndOpenBoard, todoCard, listTitleBox } from './helpers';

// spec: tests/e2e/E2E_TEST_PLAN.md
// テストプラン: 2. カンバンボード表示（Critical）

const CATEGORIES = ['in-progress', 'done', 'todo'];

test.describe('カンバンボード表示（Critical）', () => {
  test.beforeEach(async ({ page }) => {
    await signInAndOpenBoard(page);
  });

  test('2.1 Todoページ初期表示', async ({ page }) => {
    // 既存の3つのリストが表示される
    for (const category of CATEGORIES) {
      await expect(listTitleBox(page, category)).toBeVisible();
    }

    // 各リストのタスクが表示される
    await expect(
      page.getByText('Next.js App Routerの学習', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText('TypeScript最適化', { exact: true }),
    ).toBeVisible();
    await expect(page.getByText('MSWの実装', { exact: true })).toBeVisible();

    // 新規作成ボタン・各リストの追加ボタンが表示される
    await expect(page.getByRole('button', { name: '新規作成' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'TODOを追加する' }),
    ).toHaveCount(3);
  });

  test('2.2 リストの表示とスクロール', async ({ page }) => {
    // 全てのリストが表示されている
    for (const category of CATEGORIES) {
      await expect(listTitleBox(page, category)).toBeVisible();
    }

    // モバイルビューに切り替えても全リストにアクセスできる
    await page.setViewportSize({ width: 375, height: 667 });
    for (const category of CATEGORIES) {
      await expect(listTitleBox(page, category)).toBeVisible();
    }
  });

  test('2.3 Todoアイテムの詳細表示', async ({ page }) => {
    // アイテムのテキストが表示される
    const card = todoCard(page, 'MSWの実装');
    await expect(card).toBeVisible();

    // ステータス（ピン留め）・編集・削除のアクションボタンが表示される
    await expect(card.getByRole('button', { name: 'ピン留め' })).toBeVisible();
    await expect(card.getByRole('button', { name: '編集' })).toBeVisible();
    await expect(card.getByRole('button', { name: '削除' })).toBeVisible();
  });
});
