import { test, expect } from '@playwright/test';

test.describe('Todo管理フロー', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にログインページに移動
    await page.goto('/signin');
  });

  test('ユーザーログイン〜Todo作成〜編集〜削除の一連のフロー', async ({
    page,
  }) => {
    // ログイン
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');

    // Todoページへの遷移を確認
    await expect(page).toHaveURL(/.*todo/);
    await expect(page.locator('[data-testid="todo-list"]')).toBeVisible();

    // 新しいTodoの作成
    const newTodoText = 'E2Eテストで作成されたTodo';
    await page.fill('[data-testid="todo-input"]', newTodoText);
    await page.click('[data-testid="add-todo-button"]');

    // 作成されたTodoの確認
    await expect(page.locator(`text=${newTodoText}`)).toBeVisible();

    // Todo項目の編集
    const todoItem = page
      .locator(`[data-testid*="todo-item"]`)
      .filter({ hasText: newTodoText });
    await todoItem.locator('[data-testid="edit-button"]').click();

    const editedTodoText = 'E2Eテストで編集されたTodo';
    await page.fill('[data-testid="edit-todo-input"]', editedTodoText);
    await page.click('[data-testid="save-edit-button"]');

    // 編集されたTodoの確認
    await expect(page.locator(`text=${editedTodoText}`)).toBeVisible();
    await expect(page.locator(`text=${newTodoText}`)).not.toBeVisible();

    // Todoのステータス変更
    const editedTodoItem = page
      .locator(`[data-testid*="todo-item"]`)
      .filter({ hasText: editedTodoText });
    await editedTodoItem
      .locator('[data-testid="status-select"]')
      .selectOption('done');

    // ステータス変更の確認
    await expect(
      editedTodoItem.locator('[data-testid="status-badge"]'),
    ).toContainText('done');

    // Todoの削除
    await editedTodoItem.locator('[data-testid="delete-button"]').click();
    await page.click('[data-testid="confirm-delete-button"]');

    // 削除されたTodoの確認
    await expect(page.locator(`text=${editedTodoText}`)).not.toBeVisible();
  });

  test('ドラッグ&ドロップでTodoの並び替え', async ({ page }) => {
    // ログイン
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');

    // Todoページへの遷移を確認
    await expect(page).toHaveURL(/.*todo/);

    // 2つのTodoを作成
    await page.fill('[data-testid="todo-input"]', '最初のTodo');
    await page.click('[data-testid="add-todo-button"]');

    await page.fill('[data-testid="todo-input"]', '2番目のTodo');
    await page.click('[data-testid="add-todo-button"]');

    // ドラッグ&ドロップで並び替え
    const firstTodo = page
      .locator('[data-testid*="todo-item"]')
      .filter({ hasText: '最初のTodo' });
    const secondTodo = page
      .locator('[data-testid*="todo-item"]')
      .filter({ hasText: '2番目のTodo' });

    await firstTodo.dragTo(secondTodo);

    // 並び替えが反映されていることを確認
    const todoItems = page.locator('[data-testid*="todo-item"]');
    await expect(todoItems.nth(0)).toContainText('2番目のTodo');
    await expect(todoItems.nth(1)).toContainText('最初のTodo');
  });

  test('リスト管理機能', async ({ page }) => {
    // ログイン
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');

    // Todoページへの遷移を確認
    await expect(page).toHaveURL(/.*todo/);

    // 新しいリストの作成
    await page.click('[data-testid="add-list-button"]');
    await page.fill('[data-testid="list-name-input"]', '新しいリスト');
    await page.click('[data-testid="create-list-button"]');

    // 作成されたリストの確認
    await expect(page.locator('text=新しいリスト')).toBeVisible();

    // リストの切り替え
    await page.click('[data-testid="list-selector"]');
    await page
      .locator('[data-testid="list-option"]')
      .filter({ hasText: '新しいリスト' })
      .click();

    // リストが切り替わったことを確認
    await expect(page.locator('[data-testid="current-list"]')).toContainText(
      '新しいリスト',
    );
  });

  test('ピン留め機能', async ({ page }) => {
    // ログイン
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');

    // Todoページへの遷移を確認
    await expect(page).toHaveURL(/.*todo/);

    // 新しいTodoの作成
    await page.fill('[data-testid="todo-input"]', 'ピン留めテスト用Todo');
    await page.click('[data-testid="add-todo-button"]');

    // Todoのピン留め
    const todoItem = page
      .locator('[data-testid*="todo-item"]')
      .filter({ hasText: 'ピン留めテスト用Todo' });
    await todoItem.locator('[data-testid="pin-button"]').click();

    // ピン留めの確認
    await expect(todoItem.locator('[data-testid="pin-icon"]')).toBeVisible();

    // ピン留めされたTodoが上部に表示されることを確認
    const pinnedTodos = page.locator(
      '[data-testid="pinned-todos"] [data-testid*="todo-item"]',
    );
    await expect(
      pinnedTodos.filter({ hasText: 'ピン留めテスト用Todo' }),
    ).toBeVisible();
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // ログイン
    await page.goto('/signin');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');

    // Todoページへの遷移を確認
    await expect(page).toHaveURL(/.*todo/);

    // モバイル版のナビゲーションメニューの確認
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // モバイル版でのTodo作成機能の確認
    await page.fill('[data-testid="todo-input"]', 'モバイルテスト用Todo');
    await page.click('[data-testid="add-todo-button"]');
    await expect(page.locator('text=モバイルテスト用Todo')).toBeVisible();
  });
});
