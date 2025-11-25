import { test, expect } from '@playwright/test';

// spec: tests/e2e/E2E_TEST_PLAN.md
// テストプラン: 1. 認証フロー（Critical）

test.describe('認証フロー（Critical）', () => {
  // テスト用ユーザー情報（Docker開発環境）
  const TEST_USER = {
    email: 'dev.user@todoapp.com', // Docker開発環境用テストユーザー
    password: 'devpassword123', // E2E_TEST_PLAN.mdに記載の正しいパスワード
  };

  const INVALID_USER = {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  };

  test.beforeEach(async ({ page }) => {
    // 各テスト前にセッションをクリア
    await page.context().clearCookies();
  });

  test('1.1 トップページ表示とナビゲーション', async ({ page }) => {
    // 1. ブラウザで http://localhost:3000 にアクセス
    await page.goto('/');

    // 2. トップページが表示されることを確認
    await expect(page).toHaveURL('/');
    await expect(
      page
        .locator('h2')
        .filter({ hasText: 'ダッシュボートへのアクセスはこちら' }),
    ).toBeVisible();

    // ナビゲーションリンク（SignIn）が表示される
    const signInLink = page.getByRole('link', { name: 'サインイン' }).first();
    await expect(signInLink).toBeVisible();

    // 3. "SignIn"リンクをクリック
    await signInLink.click();

    // 4. サインインページ（/signin）に遷移することを確認
    await expect(page).toHaveURL(/\/signin/);
  });

  test('1.2 サインイン（正常系）', async ({ page }) => {
    // サインインページにアクセス
    await page.goto('/signin');

    // 1. メールアドレス入力フィールドに test-user-1@example.com を入力
    await page.fill('input[name="email"]', TEST_USER.email);

    // 2. パスワード入力フィールドに devpassword123 を入力
    await page.fill('input[name="password"]', TEST_USER.password);

    // 3. "サインイン"ボタンをクリック
    await page.click('button[type="submit"]');

    // 4. 認証処理が完了するまで待機、Todoページ（/todo）にリダイレクトされることを確認
    await expect(page).toHaveURL('/todo', { timeout: 30000 });

    // ページヘッダーにログアウトボタンが表示される
    // ユーザーアイコンをクリックしてナビゲーションを開く
    // 修正: ヘッダー内のユーザーアイコンボタンを特定
    const userIcon = page.locator('header button[type="button"]').first();
    await userIcon.waitFor({ state: 'visible', timeout: 5000 });
    await userIcon.click();

    // サインアウトボタンが表示される
    await expect(
      page.getByRole('button', { name: 'サインアウト' }),
    ).toBeVisible();

    // ナビゲーションを閉じる
    await page.keyboard.press('Escape');

    // 既存のTodoとリストが表示される（TODOを追加するボタンで確認）
    await expect(
      page.getByRole('button', { name: 'TODOを追加する' }).first(),
    ).toBeVisible();
  });

  test('1.3 サインイン（異常系：無効な認証情報）', async ({ page }) => {
    // サインインページにアクセス
    await page.goto('/signin');

    // 1. メールアドレス入力フィールドに invalid@example.com を入力
    await page.fill('input[name="email"]', INVALID_USER.email);

    // 2. パスワード入力フィールドに wrongpassword を入力
    await page.fill('input[name="password"]', INVALID_USER.password);

    // 3. "サインイン"ボタンをクリック
    await page.click('button[type="submit"]');

    // 4. エラーメッセージが表示されることを確認
    // ValidationCheckコンポーネントで表示される実際のエラーメッセージ
    // セレクター修正: p.text-red-600 内にエラーメッセージが表示される
    await expect(
      page.locator('p.text-red-600', {
        hasText: '入力内容に問題があります',
      }),
    ).toBeVisible({
      timeout: 10000,
    });

    // サインインページに留まる
    await expect(page).toHaveURL(/\/signin/);
  });

  test('1.4 サインイン（異常系：空フィールド）', async ({ page }) => {
    // サインインページにアクセス
    await page.goto('/signin');

    // 1. メールアドレスとパスワードフィールドを空のまま

    // 2. "サインイン"ボタンをクリック
    // 修正: HTML5バリデーションは実際にはrequired属性がないため、
    // サーバーサイドバリデーションが動作する
    await page.click('button[type="submit"]');

    // 3. バリデーションエラーメッセージが表示されることを確認
    // 両方空の場合、ValidationCheckまたはMailField/PasswordFieldでエラーが表示される
    // ValidationCheckコンポーネントのエラー、またはフィールドエラーのいずれかを確認
    const validationError = page.locator('p.text-red-600');
    const fieldError = page.locator('label.text-red-600 span.text-red-600');

    // いずれかのエラーが表示されることを確認（要素の可視性を待機）
    await expect(validationError.or(fieldError).first()).toBeVisible({
      timeout: 5000,
    });

    // サインインページに留まる
    await expect(page).toHaveURL(/\/signin/);
  });

  test('1.5 サインアウト', async ({ page }) => {
    // 事前条件: ユーザーが認証済み
    await page.goto('/signin');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // 1. todo へのリダイレクトを待機、Todoページ（/todo）が表示されている状態
    await expect(page).toHaveURL('/todo', { timeout: 30000 });

    // 2. ヘッダーのログアウトボタンをクリック
    // ユーザーアイコンをクリックしてナビゲーションを開く
    // 修正: ヘッダー内のユーザーアイコンボタンを特定
    const userIcon = page.locator('header button[type="button"]').first();
    await userIcon.waitFor({ state: 'visible', timeout: 5000 });
    await userIcon.click();

    // サインアウトボタンをクリック
    await page.getByRole('button', { name: 'サインアウト' }).click();

    // 3. ログアウト確認モーダルが表示される場合は"はい"をクリック
    // 修正: モーダルのテキストは「サインアウトしますか？」（全角疑問符）
    await expect(page.locator('text=サインアウトしますか？')).toBeVisible();
    await page.getByRole('button', { name: 'はい' }).click();

    // 4. トップページ（/）にリダイレクトされることを確認（signOut.ts: redirectTo: '/'）
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // 5. Todoページ（/todo）に直接アクセスしようとすると、サインインページにリダイレクトされることを確認
    await page.goto('/todo');
    await expect(page).toHaveURL(/\/signin/, { timeout: 10000 });
  });

  test('1.6 サインアップ（正常系）', async ({ page }) => {
    // サインアップページにアクセス
    await page.goto('/signup');

    // 1. メールアドレス入力フィールドに新規メールアドレスを入力
    const newEmail = `newuser-${Date.now()}@example.com`;
    await page.fill('input[name="email"]', newEmail);

    // 2. パスワード入力フィールドに newpassword123 を入力
    await page.fill('input[name="password"]', 'newpassword123');

    // 3. "登録する"ボタンをクリック
    await page.click('button[type="submit"]');

    // 4. アカウント作成処理が完了するまで待機
    // 認証中ボタンが見えない場合もあるのでtry-catch
    try {
      await page
        .getByRole('button', { name: '認証中' })
        .waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      // 認証が高速すぎて認証中状態が見えない場合はスキップ
    }

    // 5. サインインページ（/signin）にリダイレクトされることを確認
    await expect(page).toHaveURL(new RegExp('/signin'), { timeout: 30000 });

    // 6. 作成したアカウントでログインできることを確認
    await page.fill('input[name="email"]', newEmail);
    await page.fill('input[name="password"]', 'newpassword123');
    await page.click('button[type="submit"]');

    // リダイレクトを待機、ログイン成功後、Todoページにリダイレクトされる
    await expect(page).toHaveURL('/todo', { timeout: 30000 });
  });

  test('1.7 サインアップ（異常系：既存メールアドレス）', async ({ page }) => {
    // サインアップページにアクセス
    await page.goto('/signup');

    // 1. メールアドレス入力フィールドに test-user-1@example.com を入力
    await page.fill('input[name="email"]', TEST_USER.email);

    // 2. パスワード入力フィールドに devpassword123 を入力
    await page.fill('input[name="password"]', TEST_USER.password);

    // 3. "登録する"ボタンをクリック
    await page.click('button[type="submit"]');

    // 4. エラーメッセージが表示されることを確認
    await expect(
      page.locator(
        'text=/このメールアドレスは既に登録されています|すでに使用されています/',
      ),
    ).toBeVisible({
      timeout: 10000,
    });

    // サインアップページに留まる
    await expect(page).toHaveURL(/\/signup/);
  });
});
