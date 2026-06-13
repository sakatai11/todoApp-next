import { test, expect } from '@playwright/test';
import { signInAndOpenBoard } from './helpers';

// spec: tests/e2e/E2E_TEST_PLAN.md
// テストプラン: 8. パフォーマンスとアクセシビリティ（Low）

test.describe('パフォーマンスとアクセシビリティ（Low）', () => {
  test('8.1 ページ読み込み速度の確認', async ({ page }) => {
    // サインインからボードが操作可能になるまでの所要時間を計測する
    const start = Date.now();
    await signInAndOpenBoard(page);
    const elapsed = Date.now() - start;

    // dev環境かつ並列実行のためサーバー負荷で変動する。
    // ハング検知を目的とした緩い上限のみを検証する。
    expect(elapsed).toBeLessThan(45000);
  });

  test('8.2 キーボードナビゲーションの確認', async ({ page }) => {
    await signInAndOpenBoard(page);

    // Tabでインタラクティブ要素にフォーカスが移動する
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName ?? '',
    );
    expect(['BUTTON', 'A', 'INPUT', 'TEXTAREA']).toContain(focusedTag);

    // モーダルがEscapeキーで閉じる
    await page.getByRole('button', { name: '新規作成' }).click();
    await expect(page.locator('#modal-modal-text')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-modal-text')).toBeHidden();
  });

  test('8.3 スクリーンリーダー対応（ARIA属性）の確認', async ({ page }) => {
    await signInAndOpenBoard(page);

    // 主要なアクションに適切なaria-labelが設定されている
    await expect(
      page.getByRole('button', { name: '編集' }).first(),
    ).toBeVisible();
    expect(
      await page.getByRole('button', { name: '編集' }).count(),
    ).toBeGreaterThan(0);
    expect(
      await page.getByRole('button', { name: '削除' }).count(),
    ).toBeGreaterThan(0);
    expect(
      await page.getByRole('button', { name: 'ピン留め' }).count(),
    ).toBeGreaterThan(0);

    // 各リストに操作メニュー・並び替えのラベルが付与されている
    expect(
      await page.getByRole('button', { name: 'リスト操作メニュー' }).count(),
    ).toBe(3);
    expect(
      await page.getByRole('button', { name: 'リストを並び替え' }).count(),
    ).toBe(3);

    // ページ見出しが存在する
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
  });
});
