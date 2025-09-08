/**
 * MCP拡張E2Eテスト - 既存のtodo-flow.spec.tsと並行動作する検証ツール
 * 高度なブラウザ自動化とデバッグ機能を提供
 */

import { test, expect, Page } from '@playwright/test';
import MCPTestHelper from '../utils/mcp-test-helper';
import { join } from 'path';

// テスト用認証情報
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'testpassword123';

// MCP設定
const MCP_CONFIG = {
  port: 3002, // 既存テストと重複しないポート
  browser: 'chrome' as const,
  headless: process.env.CI ? true : false,
  outputDir: join(process.cwd(), 'tests', 'output', 'mcp-enhanced'),
  saveSession: true,
  saveTrace: true,
};

let mcpHelper: MCPTestHelper;

// ログインヘルパー関数
async function loginUser(page: Page) {
  await page.goto('/signin');
  await page.fill('[data-testid="email-input"]', TEST_EMAIL);
  await page.fill('[data-testid="password-input"]', TEST_PASSWORD);
  await page.click('[data-testid="login-button"]');

  // Todoページへの遷移を確認
  await expect(page).toHaveURL(/.*todo/);
  await expect(page.locator('[data-testid="todo-list"]')).toBeVisible();
}

test.describe('MCP拡張Todo管理フロー', () => {
  test.beforeAll(async () => {
    // MCPヘルパーの初期化
    mcpHelper = new MCPTestHelper(MCP_CONFIG);

    // MCPサーバー起動（バックグラウンド）
    try {
      await mcpHelper.startMCPServer();
      console.log('MCPサーバーが正常に起動しました');
    } catch (error) {
      console.warn('MCPサーバー起動に失敗しました:', error);
      // テスト続行（既存機能のみ使用）
    }
  });

  test.afterAll(async () => {
    // MCPサーバー停止
    if (mcpHelper) {
      await mcpHelper.stopMCPServer();
    }
  });

  test.beforeEach(async ({ page }) => {
    // 各テスト前にログインを実行
    await loginUser(page);
  });

  test('MCP拡張: Todo作成における高度な要素検証', async ({ page }) => {
    // 既存のPlaywrightテストと同じ操作
    const newTodoText = 'MCP拡張テストで作成されたTodo';
    await page.fill('[data-testid="todo-input"]', newTodoText);
    await page.click('[data-testid="add-todo-button"]');

    // 作成されたTodoの確認
    await expect(page.locator(`text=${newTodoText}`)).toBeVisible();

    // MCP拡張: 詳細なページ要素検証
    const elementValidation = await mcpHelper.validatePageElements(page.url());

    // 検証結果の確認（基本構造）
    expect(elementValidation.url).toBe(page.url());
    expect(elementValidation.timestamp).toBeTruthy();

    // スクリーンショット取得
    const screenshotResult = await mcpHelper.captureAndCompare('todo-creation');
    expect(screenshotResult.testName).toBe('todo-creation');
    expect(screenshotResult.screenshotPath).toContain('todo-creation.png');

    console.log('MCP拡張検証完了:', {
      elementValidation: elementValidation.elements.length,
      screenshotPath: screenshotResult.screenshotPath,
    });
  });

  test('MCP拡張: ドラッグ&ドロップの高度なインタラクション検証', async ({
    page,
  }) => {
    // 2つのTodoを作成
    await page.fill('[data-testid="todo-input"]', 'MCP-ドラッグ元Todo');
    await page.click('[data-testid="add-todo-button"]');

    await page.fill('[data-testid="todo-input"]', 'MCP-ドロップ先Todo');
    await page.click('[data-testid="add-todo-button"]');

    // 基本的なドラッグ&ドロップ操作
    const firstTodo = page
      .locator('[data-testid*="todo-item"]')
      .filter({ hasText: 'MCP-ドラッグ元Todo' });
    const secondTodo = page
      .locator('[data-testid*="todo-item"]')
      .filter({ hasText: 'MCP-ドロップ先Todo' });

    await firstTodo.dragTo(secondTodo);

    // 基本的な並び替え確認
    const todoItems = page.locator('[data-testid*="todo-item"]');
    await expect(todoItems.nth(0)).toContainText('MCP-ドロップ先Todo');
    await expect(todoItems.nth(1)).toContainText('MCP-ドラッグ元Todo');

    // MCP拡張: 高度なインタラクション検証
    const interactions = [
      {
        name: 'drag-validation',
        type: 'drag' as const,
        selector: '[data-testid*="todo-item"]',
        options: {
          sourceText: 'MCP-ドラッグ元Todo',
          targetText: 'MCP-ドロップ先Todo',
        },
      },
    ];

    const interactionResults =
      await mcpHelper.validateUserInteractions(interactions);

    // 結果検証（基本構造）
    expect(interactionResults).toHaveLength(1);
    expect(interactionResults[0].name).toBe('drag-validation');
    expect(interactionResults[0].type).toBe('drag');

    console.log('MCP拡張インタラクション検証完了:', interactionResults);
  });

  test('MCP拡張: リスト管理の並行デバッグ機能', async ({ page }) => {
    // デバッグ情報収集開始
    const debugResult = await mcpHelper.debugParallelTest('todo-flow.spec.ts');

    // 基本的なリスト管理操作
    await page.click('[data-testid="add-list-button"]');
    await page.fill('[data-testid="list-name-input"]', 'MCP拡張テストリスト');
    await page.click('[data-testid="create-list-button"]');

    // 作成されたリストの確認
    await expect(page.locator('text=MCP拡張テストリスト')).toBeVisible();

    // リストの切り替え
    await page.click('[data-testid="list-selector"]');
    await page
      .locator('[data-testid="list-option"]')
      .filter({ hasText: 'MCP拡張テストリスト' })
      .click();

    // リストが切り替わったことを確認
    await expect(page.locator('[data-testid="current-list"]')).toContainText(
      'MCP拡張テストリスト',
    );

    // MCP拡張: デバッグ情報の検証
    expect(debugResult.testFile).toBe('todo-flow.spec.ts');
    expect(debugResult.timestamp).toBeTruthy();

    // ブラウザ状態の詳細情報が収集されていることを確認
    expect(debugResult.browserState).toBeDefined();
    expect(debugResult.networkActivity).toBeDefined();
    expect(debugResult.consoleMessages).toBeDefined();
    expect(debugResult.errors).toBeDefined();

    console.log('MCP拡張デバッグ情報:', {
      url: debugResult.browserState.url,
      networkRequests: debugResult.networkActivity.length,
      consoleMessages: debugResult.consoleMessages.length,
      errors: debugResult.errors.length,
    });
  });

  test('MCP拡張: レスポンシブデザインの詳細スクリーンショット比較', async ({
    page,
  }) => {
    // デスクトップ版スクリーンショット
    const desktopScreenshot =
      await mcpHelper.captureAndCompare('responsive-desktop');

    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // モバイル版の基本操作
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    await page.fill('[data-testid="todo-input"]', 'MCP-モバイルテスト用Todo');
    await page.click('[data-testid="add-todo-button"]');
    await expect(page.locator('text=MCP-モバイルテスト用Todo')).toBeVisible();

    // モバイル版スクリーンショット（デスクトップ版と比較）
    const mobileScreenshot = await mcpHelper.captureAndCompare(
      'responsive-mobile',
      desktopScreenshot.screenshotPath,
    );

    // スクリーンショット結果の検証
    expect(desktopScreenshot.testName).toBe('responsive-desktop');
    expect(mobileScreenshot.testName).toBe('responsive-mobile');
    expect(mobileScreenshot.comparison).toBeDefined();

    console.log('MCP拡張レスポンシブ検証完了:', {
      desktop: desktopScreenshot.screenshotPath,
      mobile: mobileScreenshot.screenshotPath,
      comparison: mobileScreenshot.comparison?.diffPath,
    });
  });

  test('MCP拡張: Todo削除の完全フロー検証', async ({ page }) => {
    // 新しいTodoの作成
    const testTodoText = 'MCP拡張削除テスト用Todo';
    await page.fill('[data-testid="todo-input"]', testTodoText);
    await page.click('[data-testid="add-todo-button"]');

    // 作成確認
    await expect(page.locator(`text=${testTodoText}`)).toBeVisible();

    // 削除前の詳細要素検証
    const beforeDeletion = await mcpHelper.validatePageElements(page.url());

    // Todoの削除
    const todoItem = page
      .locator(`[data-testid*="todo-item"]`)
      .filter({ hasText: testTodoText });
    await todoItem.locator('[data-testid="delete-button"]').click();
    await page.click('[data-testid="confirm-delete-button"]');

    // 削除確認
    await expect(page.locator(`text=${testTodoText}`)).not.toBeVisible();

    // 削除後の詳細要素検証
    const afterDeletion = await mcpHelper.validatePageElements(page.url());

    // MCP拡張: 削除前後の比較検証
    expect(beforeDeletion.timestamp).toBeTruthy();
    expect(afterDeletion.timestamp).toBeTruthy();
    expect(beforeDeletion.url).toBe(afterDeletion.url);

    // 削除完了のスクリーンショット
    const deletionScreenshot = await mcpHelper.captureAndCompare(
      'todo-deletion-complete',
    );

    console.log('MCP拡張削除検証完了:', {
      beforeElements: beforeDeletion.elements.length,
      afterElements: afterDeletion.elements.length,
      screenshotPath: deletionScreenshot.screenshotPath,
    });
  });
});
