import { test, expect } from '@playwright/test';
import { signInAndOpenBoard, todoCard, createTodoViaModal } from './helpers';

// spec: tests/e2e/E2E_TEST_PLAN.md
// テストプラン: 6. エラーハンドリングとエッジケース（Medium）

test.describe('エラーハンドリングとエッジケース（Medium）', () => {
  test('6.1 ネットワークエラー時の表示', async () => {
    // MSWのService Workerがリクエストをページ内で先に処理するため、
    // Playwrightのpage.routeではAPI失敗を注入できずネットワークエラーを再現できない。
    test.skip(
      true,
      'MSWがエンドポイントをモックするため、Playwright層でのネットワーク障害注入が不可能なため',
    );
  });

  test('6.2 セッション期限切れ時の表示', async ({ page }) => {
    await signInAndOpenBoard(page);

    // セッションCookieをクリアして保護ページへ再アクセス
    await page.context().clearCookies();
    await page.goto('/todo', { waitUntil: 'commit' });

    // サインインページにリダイレクトされる
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });
  });

  test('6.3 長文テキストのハンドリング', async ({ page }) => {
    await signInAndOpenBoard(page);

    const marker = `LONG${Date.now()}`;
    const longText = `${marker}-${'あ'.repeat(1000)}`;
    await createTodoViaModal(page, longText, 'in-progress');

    // 長文でもレイアウトが崩れず表示される
    await expect(todoCard(page, longText)).toBeVisible({ timeout: 10000 });
  });

  test('6.4 特殊文字のハンドリング', async ({ page }) => {
    await signInAndOpenBoard(page);

    // XSSが実行された場合に検知するためのダイアログ監視
    let dialogFired = false;
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    const marker = `XSS${Date.now()}`;
    const text = `${marker} 🚀💻 <script>alert('xss')</script> & "quote"`;
    await createTodoViaModal(page, text, 'in-progress');

    // 特殊文字を含むテキストがエスケープされて表示される
    await expect(page.getByText(marker).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText("<script>alert('xss')</script>").first(),
    ).toBeVisible();

    // スクリプトは実行されない
    expect(dialogFired).toBe(false);
  });

  test('6.5 同時編集の競合ハンドリング', async () => {
    // MSWのモック状態はブラウザコンテキストごとに独立しているため、
    // 複数タブ間の同時編集競合をE2Eで再現できない。
    test.skip(
      true,
      'MSW環境ではコンテキスト間で状態が共有されず競合を再現できないため',
    );
  });
});
