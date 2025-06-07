# Mock Submodule Migration Guide

## 現在のモック使用状況

### 分析結果
現在 `mocks/` ディレクトリは以下の箇所で使用されています：

1. **app/libs/fetchUserForTemplate.ts** - `@/mocks/data` からユーザーデータ
2. **app/providers/MSWProvider.tsx** - `@/mocks/initMocks` でMSW初期化
3. **app/api/auth/server-login/route.ts** - `@/mocks/data/user` でモック認証
4. **mocks/data/index.ts** - 内部依存関係

## 提案構造

### todoApp-submodule ディレクトリ構造
```
todoApp-submodule/
├── mocks/
│   ├── browser.ts
│   ├── server.ts
│   ├── initMocks.ts
│   ├── data/
│   │   ├── index.ts
│   │   ├── lists.ts
│   │   ├── todos.ts
│   │   └── user.ts
│   └── handlers/
│       ├── auth.ts
│       ├── dashboard.ts
│       ├── index.ts
│       ├── lists.ts
│       └── todos.ts
├── package.json
└── README.md
```

## Step 1: todoApp-submodule リポジトリの準備

### 1-1. 新しいリポジトリ作成
GitHubで `todoApp-submodule` リポジトリを作成してください。

### 1-2. 初期設定ファイル

**package.json**:
```json
{
  "name": "todoapp-submodule",
  "version": "1.0.0",
  "description": "Mock API and shared utilities for TodoApp",
  "main": "mocks/index.js",
  "type": "module",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "peerDependencies": {
    "msw": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0"
  }
}
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 2: ファイル移行

### 2-1. mockファイルの移行
```bash
# 現在のmocksディレクトリをサブモジュールにコピー
mkdir -p todoApp-submodule
cp -r mocks/ todoApp-submodule/
```

### 2-2. package.jsonとtsconfig.jsonの追加
上記の設定ファイルをサブモジュールに追加

## Step 3: メインプロジェクトの修正

### 3-1. tsconfig.json の path 設定更新

**修正前**:
```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

**修正後**:
```json
{
  "paths": {
    "@/*": ["./*"],
    "@/submodule/*": ["./todoApp-submodule/*"]
  }
}
```

### 3-2. import文の修正

**app/libs/fetchUserForTemplate.ts**:
```typescript
// 修正前
import { user } from '@/mocks/data';

// 修正後
import { user } from '@/submodule/mocks/data';
```

**app/providers/MSWProvider.tsx**:
```typescript
// 修正前
const { initMocks } = await import('@/mocks/initMocks');

// 修正後
const { initMocks } = await import('@/submodule/mocks/initMocks');
```

**app/api/auth/server-login/route.ts**:
```typescript
// 修正前
const { mockUser } = await import('@/mocks/data/user');

// 修正後
const { mockUser } = await import('@/submodule/mocks/data/user');
```

### 3-3. mocks/data/index.ts の修正
```typescript
// 修正前
import { lists } from '@/mocks/data/lists';
import { todos } from '@/mocks/data/todos';
import { mockUser } from '@/mocks/data/user';

// 修正後
import { lists } from '@/submodule/mocks/data/lists';
import { todos } from '@/submodule/mocks/data/todos';
import { mockUser } from '@/submodule/mocks/data/user';
```

## Step 4: サブモジュールとして追加

### 4-1. 既存mocksディレクトリの削除
```bash
# バックアップ作成
cp -r mocks/ ../mocks-backup/

# 既存のmocksディレクトリを削除
rm -rf mocks/
```

### 4-2. サブモジュール追加
```bash
git submodule add https://github.com/YOUR_USERNAME/todoApp-submodule.git todoApp-submodule
```

### 4-3. .gitmodulesの確認
```ini
[submodule "todoApp-submodule"]
	path = todoApp-submodule
	url = https://github.com/YOUR_USERNAME/todoApp-submodule.git
```

## Step 5: package.jsonの依存関係チェック

### 5-1. MSW依存関係の確認
メインプロジェクトの package.json で MSW が正しく設定されていることを確認：

```json
{
  "dependencies": {
    "msw": "^2.0.0"
  }
}
```

### 5-2. TypeScript設定の確認
サブモジュール内の型定義が正しく認識されることを確認

## Step 6: .gitignore の更新

**.gitignore** に以下を追加（必要に応じて）:
```gitignore
# Submodule build artifacts
todoApp-submodule/dist/
todoApp-submodule/node_modules/

# Local development
.env.local
```

## Step 7: 動作確認

### 7-1. 型チェック
```bash
npm run type-check
# または
npx tsc --noEmit
```

### 7-2. モック機能のテスト
```bash
# 開発サーバー起動
npm run dev

# 環境変数の確認
NEXT_PUBLIC_API_MOCKING=enabled npm run dev
```

### 7-3. MSW動作確認
ブラウザのNetwork タブでモックAPIが動作していることを確認

## Step 8: チーム開発用の設定

### 8-1. README.md の更新
```markdown
## Development Setup

### Clone with submodules
\`\`\`bash
git clone --recurse-submodules https://github.com/YOUR_USERNAME/todoApp-next.git
\`\`\`

### Initialize submodules (if already cloned)
\`\`\`bash
git submodule update --init --recursive
\`\`\`

### Update submodules
\`\`\`bash
git submodule update --remote
\`\`\`
```

### 8-2. 開発環境セットアップスクリプト
**scripts/setup-dev.sh**:
```bash
#!/bin/bash
set -e

echo "Setting up development environment..."

# Install main dependencies
npm install

# Initialize submodules
git submodule update --init --recursive

# Install submodule dependencies (if needed)
if [ -f "todoApp-submodule/package.json" ]; then
  cd todoApp-submodule
  npm install
  cd ..
fi

echo "Development environment setup complete!"
```

## 注意事項

### 1. パス解決の注意
- `@/submodule/*` パスが正しく解決されることを確認
- IDEの設定も必要に応じて更新

### 2. 型定義の共有
- サブモジュール内の型定義がメインプロジェクトで使用できることを確認
- 必要に応じて型定義ファイルをエクスポート

### 3. ビルド時の考慮
- Next.js のビルド時にサブモジュールが正しく処理されることを確認
- 必要に応じて next.config.ts を調整

### 4. 環境変数
- `NEXT_PUBLIC_API_MOCKING=enabled` の設定が引き続き有効であることを確認

## トラブルシューティング

### Import エラーが発生する場合
1. tsconfig.json の paths 設定を確認
2. サブモジュールが正しく初期化されているか確認
3. 型定義ファイルの場所を確認

### MSW が動作しない場合
1. サブモジュール内のファイルパスを確認
2. 環境変数の設定を確認
3. ブラウザの開発者ツールでエラーログを確認

### サブモジュール更新時の注意
```bash
# サブモジュール内で変更を行った後
cd todoApp-submodule
git add .
git commit -m "Update mock data"
git push origin main

# メインプロジェクトで参照を更新
cd ..
git add todoApp-submodule
git commit -m "Update submodule reference"
git push origin develop
```