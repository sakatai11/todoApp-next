import { test, expect } from '@playwright/test';
import { signInAndOpenBoard, todoCard, createTodoViaModal } from './helpers';

// spec: tests/e2e/E2E_TEST_PLAN.md
// テストプラン: 3. タスク管理機能（Critical）

test.describe('タスク管理機能（Critical）', () => {
  test.beforeEach(async ({ page }) => {
    await signInAndOpenBoard(page);
  });

  test('3.1 新規Todo作成（正常系）', async ({ page }) => {
    const text = `E2Eテスト: 新規タスク - ${Date.now()}`;

    // 「新規作成」モーダルからテキストとステータスを指定して作成する
    await createTodoViaModal(page, text, 'in-progress');

    // 作成したタスクがボードに表示される
    await expect(page.getByText(text, { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test('3.2 新規Todo作成（異常系：空テキスト）', async ({ page }) => {
    // 先頭リストのインライン追加フォームを開く
    await page.getByRole('button', { name: 'TODOを追加する' }).first().click();

    // 空のまま「追加する」をクリック
    await page.getByRole('button', { name: '追加する', exact: true }).click();

    // バリデーションエラーが表示される
    await expect(page.getByText('入力してください')).toBeVisible();
  });

  test('3.3 Todo編集（正常系）', async ({ page }) => {
    const card = todoCard(page, 'MSWの実装');
    await card.getByRole('button', { name: '編集' }).click();

    // 編集モーダルのテキストフィールドを書き換える
    const textField = page.locator('#modal-modal-text');
    await expect(textField).toBeVisible();
    const updated = 'MSWの実装 - 編集済み';
    await textField.fill(updated);

    // 保存
    await page.getByRole('button', { name: '保存', exact: true }).click();

    // 更新後のテキストが反映され、元のテキストは消える
    await expect(page.getByText(updated, { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('MSWの実装', { exact: true })).toHaveCount(0);
  });

  test('3.4 Todo削除（正常系）', async ({ page }) => {
    const card = todoCard(page, 'MSWの実装');
    await card.getByRole('button', { name: '削除' }).click();

    // 削除確認モーダルが表示される
    await expect(page.getByText('削除しても問題ないですか？')).toBeVisible();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // 対象がリストから削除される
    await expect(page.getByText('MSWの実装', { exact: true })).toHaveCount(0);
  });

  test('3.5 Todo削除（異常系：キャンセル）', async ({ page }) => {
    const card = todoCard(page, 'Nuxt3の学習');
    await card.getByRole('button', { name: '削除' }).click();

    await expect(page.getByText('削除しても問題ないですか？')).toBeVisible();
    await page.getByRole('button', { name: 'キャンセル', exact: true }).click();

    // キャンセル後も対象は残っている
    await expect(page.getByText('Nuxt3の学習', { exact: true })).toBeVisible();
  });

  test('3.6 Todoのピン留め切り替え', async ({ page }) => {
    const card = todoCard(page, 'MSWの実装');
    const pin = card.getByRole('button', { name: 'ピン留め' });

    // 初期状態は未選択
    await expect(pin).toHaveAttribute('aria-pressed', 'false');

    // クリックで選択状態へ
    await pin.click();
    await expect(
      todoCard(page, 'MSWの実装').getByRole('button', { name: 'ピン留め' }),
    ).toHaveAttribute('aria-pressed', 'true');

    // 再クリックで未選択へ戻る
    await todoCard(page, 'MSWの実装')
      .getByRole('button', { name: 'ピン留め' })
      .click();
    await expect(
      todoCard(page, 'MSWの実装').getByRole('button', { name: 'ピン留め' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  test('3.7 複数行テキストのTodo作成', async ({ page }) => {
    const line = `E2Eテスト複数行${Date.now()}`;
    const text = `${line}\n項目1\n項目2`;

    await createTodoViaModal(page, text, 'in-progress');

    // 改行は<br>として描画され、各行のテキストは連結して保持される
    const card = todoCard(page, `${line}項目1項目2`);
    await expect(card).toBeVisible({ timeout: 10000 });

    // 改行（<br>）が2つ保持されている
    await expect(card.locator('br')).toHaveCount(2);
  });

  test('3.8 URLを含むTodo作成とリンク表示', async ({ page }) => {
    const marker = `E2Eリンク${Date.now()}`;
    const url = 'https://example.com';
    await createTodoViaModal(page, `${marker} ${url}`, 'in-progress');

    // URLがクリック可能なリンクとして表示される
    const link = page.getByRole('link', { name: url });
    await expect(link).toBeVisible({ timeout: 10000 });
    await expect(link).toHaveAttribute('href', url);
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('3.9 ダブルクォーテーションを含むTodoを正常に特定する', async ({
    page,
  }) => {
    const text = `foo"bar-${Date.now()}`;

    await createTodoViaModal(page, text, 'in-progress');

    await expect(todoCard(page, text)).toBeVisible({ timeout: 10000 });
  });

  test('3.10 シングルクォーテーションを含むTodoを正常に特定する', async ({
    page,
  }) => {
    const text = `foo'bar-${Date.now()}`;

    await createTodoViaModal(page, text, 'in-progress');

    await expect(todoCard(page, text)).toBeVisible({ timeout: 10000 });
  });
});
