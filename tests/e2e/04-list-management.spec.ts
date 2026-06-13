import { test, expect } from '@playwright/test';
import { signInAndOpenBoard, listTitleBox, openListMenu } from './helpers';

// spec: tests/e2e/E2E_TEST_PLAN.md
// テストプラン: 4. リスト管理機能（High）

test.describe('リスト管理機能（High）', () => {
  test.beforeEach(async ({ page }) => {
    await signInAndOpenBoard(page);
  });

  test('4.1 新規リスト作成（正常系）', async ({ page }) => {
    const name = `E2Eテストリスト-${Date.now()}`;

    await page.getByRole('button', { name: 'リストを追加する' }).click();
    await page.getByLabel('リスト名を入力').fill(name);
    await page.getByRole('button', { name: '追加する', exact: true }).click();

    // 新しいリストがボードに表示される
    await expect(listTitleBox(page, name)).toBeVisible({ timeout: 10000 });
  });

  test('4.2 新規リスト作成（異常系：空のリスト名）', async ({ page }) => {
    await page.getByRole('button', { name: 'リストを追加する' }).click();
    await page.getByRole('button', { name: '追加する', exact: true }).click();

    // バリデーションエラーが表示される
    await expect(page.getByText('リスト名を入力してください')).toBeVisible();
  });

  test('4.3 新規リスト作成（異常系：重複リスト名）', async ({ page }) => {
    await page.getByRole('button', { name: 'リストを追加する' }).click();
    // 既存カテゴリと同じ名前を入力
    await page.getByLabel('リスト名を入力').fill('todo');
    await page.getByRole('button', { name: '追加する', exact: true }).click();

    await expect(page.getByText('同じリスト名が存在します')).toBeVisible();
  });

  test('4.4 リスト名変更（正常系）', async ({ page }) => {
    await openListMenu(page, 'done');
    await page.getByRole('button', { name: 'リスト名を変える' }).click();

    // 編集用inputが表示されるので名前を変更してフォーカスを外す
    const renameInput = page.locator('input[id$="_input"]');
    await expect(renameInput).toBeVisible();
    await renameInput.fill('done-renamed');
    await renameInput.blur();

    // 変更後のリスト名が反映される
    await expect(listTitleBox(page, 'done-renamed')).toBeVisible({
      timeout: 10000,
    });
  });

  test('4.5 リスト削除（正常系）', async ({ page }) => {
    const name = `E2E削除リスト-${Date.now()}`;

    // 削除対象の空リストを作成
    await page.getByRole('button', { name: 'リストを追加する' }).click();
    await page.getByLabel('リスト名を入力').fill(name);
    await page.getByRole('button', { name: '追加する', exact: true }).click();
    await expect(listTitleBox(page, name)).toBeVisible({ timeout: 10000 });

    // 作成したリストを削除する
    await openListMenu(page, name);
    await page.getByRole('button', { name: 'リストを削除する' }).click();
    await expect(page.getByText('削除しても問題ないですか？')).toBeVisible();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // リストがボードから削除される
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  test('4.6 リスト削除（異常系：タスクを含むリストの警告）', async ({
    page,
  }) => {
    await openListMenu(page, 'in-progress');
    await page.getByRole('button', { name: 'リストを削除する' }).click();

    // 削除確認モーダルにタスク消去の警告が表示される
    await expect(page.getByText('削除しても問題ないですか？')).toBeVisible();
    await expect(
      page.getByText('※削除する場合、todoも消去されます。'),
    ).toBeVisible();

    // キャンセルするとリストは残る
    await page.getByRole('button', { name: 'キャンセル', exact: true }).click();
    await expect(listTitleBox(page, 'in-progress')).toBeVisible();
  });
});
