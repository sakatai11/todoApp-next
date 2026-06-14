import { Page, Locator, expect } from '@playwright/test';

// MSW環境のテストユーザー（MockIndicatorに表示される固定値）
export const TEST_USER = {
  email: 'example@test.com',
  password: 'password',
};

/**
 * サインインしてTodoページ（/todo）のボードが表示されるまで待機する。
 */
export async function signInAndOpenBoard(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/signin');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/todo', { timeout: 30000 });

  // ボードの初期データ（カラム + 追加ボタン）が描画されるまで待機
  await expect(
    page.getByRole('button', { name: 'TODOを追加する' }).first(),
  ).toBeVisible({ timeout: 15000 });
}

function toXPathLiteral(value: string): string {
  if (!value.includes("'")) {
    return `'${value}'`;
  }

  if (!value.includes('"')) {
    return `"${value}"`;
  }

  return `concat(${value
    .split("'")
    .map((part) => `'${part}'`)
    .join(`, "'", `)})`;
}

/**
 * 指定テキストのTodoカード（親Box）を返す。
 * カードは「テキスト専用の子div」を直接子に持つdivとして特定する。
 * 単一行テキストのTodoにのみ使用すること。
 */
export function todoCard(page: Page, text: string): Locator {
  const literal = toXPathLiteral(text.trim());
  // テキスト専用の子divを持つdivはカードと親グループの両方がマッチするため、
  // ドキュメント順で最も内側（カード本体）になる .last() を採用する。
  return page.locator(`xpath=//div[div[normalize-space(.)=${literal}]]`).last();
}

/**
 * 指定カテゴリ名のリストタイトル（StatusTitleのBox）を返す。
 */
export function listTitleBox(page: Page, category: string): Locator {
  const literal = toXPathLiteral(category.trim());
  return page.locator(`xpath=//div[normalize-space(.)=${literal}]`).first();
}

/**
 * 指定カテゴリのリストの操作メニュー（SelectListModal）を開く。
 */
export async function openListMenu(
  page: Page,
  category: string,
): Promise<void> {
  await listTitleBox(page, category)
    .getByRole('button', { name: 'リスト操作メニュー' })
    .click();
}

/**
 * 「新規作成」モーダルからTodoを追加する。
 * テキストとステータス（リストカテゴリ）を指定する。
 */
export async function createTodoViaModal(
  page: Page,
  text: string,
  status: string,
): Promise<void> {
  await page.getByRole('button', { name: '新規作成' }).click();

  // モーダル内のテキストフィールド
  const textField = page.locator('#modal-modal-text');
  await expect(textField).toBeVisible();
  await textField.fill(text);

  // ステータス選択（MUI Autocomplete）
  const combobox = page.getByRole('combobox');
  await combobox.click();
  await page.getByRole('option', { name: status, exact: true }).click();

  // 追加（インラインの「TODOを追加する」と区別するためexact）
  await page.getByRole('button', { name: '追加', exact: true }).click();
}
