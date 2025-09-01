#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

// VRTエラーハンドリング関連の型定義
export interface VRTError {
  type:
    | 'DEPENDENCY_ERROR'
    | 'EXECUTION_ERROR'
    | 'RESULT_PARSING_ERROR'
    | 'FILE_SYSTEM_ERROR'
    | 'UNKNOWN_ERROR';
  message: string;
  originalError?: Error;
  suggestions?: string[];
  timestamp: string;
}

export interface VRTHealthCheck {
  nodeInstalled: boolean;
  npmInstalled: boolean;
  playwrightInstalled: boolean;
  tsxInstalled: boolean;
  projectStructureValid: boolean;
  vrtConfigExists: boolean;
  dependencies: {
    [key: string]: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * VRT実行環境のヘルスチェックを実行する
 */
export async function performVRTHealthCheck(): Promise<VRTHealthCheck> {
  const result: VRTHealthCheck = {
    nodeInstalled: false,
    npmInstalled: false,
    playwrightInstalled: false,
    tsxInstalled: false,
    projectStructureValid: false,
    vrtConfigExists: false,
    dependencies: {},
    errors: [],
    warnings: [],
  };

  try {
    // Node.js のチェック
    result.nodeInstalled = await checkCommand('node --version');
    if (!result.nodeInstalled) {
      result.errors.push('Node.js がインストールされていません');
    }

    // npm のチェック
    result.npmInstalled = await checkCommand('npm --version');
    if (!result.npmInstalled) {
      result.errors.push('npm がインストールされていません');
    }

    // Playwright のチェック
    result.playwrightInstalled = await checkCommand('npx playwright --version');
    if (!result.playwrightInstalled) {
      result.errors.push('Playwright がインストールされていません');
      result.warnings.push(
        'npm install --save-dev @playwright/test でインストールしてください',
      );
    }

    // tsx のチェック
    result.tsxInstalled = await checkCommand('tsx --version');
    if (!result.tsxInstalled) {
      result.warnings.push('tsx がインストールされていません');
      result.warnings.push('npm install -g tsx でインストールしてください');
    }

    // プロジェクト構造のチェック
    result.projectStructureValid = await checkProjectStructure();
    if (!result.projectStructureValid) {
      result.errors.push('プロジェクト構造が不正です');
    }

    // VRT設定ファイルのチェック
    result.vrtConfigExists = fs.existsSync(
      path.join(process.cwd(), 'playwright.vrt.config.ts'),
    );
    if (!result.vrtConfigExists) {
      result.errors.push('playwright.vrt.config.ts が見つかりません');
    }

    // package.json の依存関係チェック
    await checkPackageDependencies(result);
  } catch (error) {
    result.errors.push(`ヘルスチェック中にエラーが発生しました: ${error}`);
  }

  return result;
}

/**
 * コマンドの実行可能性をチェックする
 */
async function checkCommand(command: string): Promise<boolean> {
  const { spawn } = await import('child_process');

  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { stdio: 'pipe' });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });

    // タイムアウト設定 (5秒)
    setTimeout(() => {
      child.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * プロジェクト構造をチェックする
 */
async function checkProjectStructure(): Promise<boolean> {
  const requiredPaths = [
    'package.json',
    'tests/vrt',
    '.github/pull_request_template.md',
  ];

  const projectRoot = process.cwd();

  for (const requiredPath of requiredPaths) {
    const fullPath = path.join(projectRoot, requiredPath);
    if (!fs.existsSync(fullPath)) {
      return false;
    }
  }

  return true;
}

/**
 * package.json の依存関係をチェックする
 */
async function checkPackageDependencies(result: VRTHealthCheck): Promise<void> {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      result.errors.push('package.json が見つかりません');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // 重要な依存関係をチェック
    const criticalDependencies = [
      '@playwright/test',
      'next',
      'react',
      'typescript',
    ];

    for (const dep of criticalDependencies) {
      result.dependencies[dep] = !!allDeps[dep];
      if (!result.dependencies[dep]) {
        result.warnings.push(`${dep} がpackage.jsonに見つかりません`);
      }
    }
  } catch (error) {
    result.errors.push(`package.json の解析でエラーが発生しました: ${error}`);
  }
}

/**
 * VRTエラーを分類・処理する
 */
export function categorizeVRTError(error: Error | string): VRTError {
  const message = typeof error === 'string' ? error : error.message;
  const timestamp = new Date().toISOString();

  // エラーメッセージを分析して分類
  if (message.includes('ENOENT') || message.includes('command not found')) {
    return {
      type: 'DEPENDENCY_ERROR',
      message,
      originalError: typeof error === 'object' ? error : undefined,
      timestamp,
      suggestions: [
        '必要な依存関係がインストールされているか確認してください',
        'npm install を実行してください',
        'Playwright ブラウザが正しくインストールされているか確認してください (npx playwright install)',
      ],
    };
  }

  if (message.includes('spawn') || message.includes('Process exited')) {
    return {
      type: 'EXECUTION_ERROR',
      message,
      originalError: typeof error === 'object' ? error : undefined,
      timestamp,
      suggestions: [
        'システムリソースが不足していないか確認してください',
        'Playwright のバージョンが互換性があるか確認してください',
        '他のプロセスが同じポートを使用していないか確認してください',
      ],
    };
  }

  if (
    message.includes('JSON') ||
    message.includes('parse') ||
    message.includes('Unexpected token')
  ) {
    return {
      type: 'RESULT_PARSING_ERROR',
      message,
      originalError: typeof error === 'object' ? error : undefined,
      timestamp,
      suggestions: [
        'VRT結果ファイルが正しく生成されているか確認してください',
        'テンプレートファイルの構文が正しいか確認してください',
        'ディスクの空き容量が十分にあるか確認してください',
      ],
    };
  }

  if (
    message.includes('EACCES') ||
    message.includes('permission denied') ||
    message.includes('EISDIR')
  ) {
    return {
      type: 'FILE_SYSTEM_ERROR',
      message,
      originalError: typeof error === 'object' ? error : undefined,
      timestamp,
      suggestions: [
        'ファイル・ディレクトリの権限を確認してください',
        'ファイルが他のプロセスによって使用されていないか確認してください',
        'ディスクの空き容量が十分にあるか確認してください',
      ],
    };
  }

  return {
    type: 'UNKNOWN_ERROR',
    message,
    originalError: typeof error === 'object' ? error : undefined,
    timestamp,
    suggestions: [
      'ログファイルを確認して詳細な情報を取得してください',
      'プロジェクトの依存関係を再インストールしてください (rm -rf node_modules && npm install)',
      'Issue として報告することを検討してください',
    ],
  };
}

/**
 * フォールバック処理：VRTが失敗した場合の代替手段
 */
export async function executeVRTFallback(error: VRTError): Promise<string> {
  console.log(
    `⚠️ VRTエラーによりフォールバック処理を実行します: ${error.type}`,
  );

  let fallbackContent = `### 📸 Visual Regression Test (VRT) 結果

❌ **VRT テスト: エラー**

VRT テスト実行中にエラーが発生しました。

**エラーカテゴリ:** ${error.type}

**エラー詳細:**
\`\`\`
${error.message}
\`\`\`

**発生時刻:** ${error.timestamp}

`;

  // 対処方法を追加
  if (error.suggestions && error.suggestions.length > 0) {
    fallbackContent += '**推奨される対処方法:**\n';
    for (const suggestion of error.suggestions) {
      fallbackContent += `- ${suggestion}\n`;
    }
    fallbackContent += '\n';
  }

  // エラータイプ別の追加処理
  switch (error.type) {
    case 'DEPENDENCY_ERROR':
      fallbackContent += await generateDependencyErrorFallback();
      break;
    case 'EXECUTION_ERROR':
      fallbackContent += await generateExecutionErrorFallback();
      break;
    case 'RESULT_PARSING_ERROR':
      fallbackContent +=
        '⚠️ **注意:** スクリーンショットの確認はマニュアルで実施してください。\n\n';
      break;
    case 'FILE_SYSTEM_ERROR':
      fallbackContent += await generateFileSystemErrorFallback();
      break;
    default:
      fallbackContent +=
        '❓ 予期しないエラーが発生しました。プロジェクトメンテナーに相談してください。\n\n';
  }

  return fallbackContent;
}

/**
 * 依存関係エラーのフォールバック処理
 */
async function generateDependencyErrorFallback(): Promise<string> {
  const healthCheck = await performVRTHealthCheck();

  let content = '**環境チェック結果:**\n';
  content += `- Node.js: ${healthCheck.nodeInstalled ? '✅' : '❌'}\n`;
  content += `- npm: ${healthCheck.npmInstalled ? '✅' : '❌'}\n`;
  content += `- Playwright: ${healthCheck.playwrightInstalled ? '✅' : '❌'}\n`;
  content += `- tsx: ${healthCheck.tsxInstalled ? '✅' : '❌'}\n`;
  content += '\n';

  if (healthCheck.errors.length > 0) {
    content += '**検出されたエラー:**\n';
    for (const error of healthCheck.errors) {
      content += `- ${error}\n`;
    }
    content += '\n';
  }

  return content;
}

/**
 * 実行エラーのフォールバック処理
 */
async function generateExecutionErrorFallback(): Promise<string> {
  return `⚠️ **注意:** VRTテストの自動実行に失敗しました。以下の手動確認をお願いします：

1. \`npm run test:vrt\` を手動実行してテストが通るか確認
2. UI変更がある場合は、スクリーンショットを手動で添付
3. ブラウザでアプリケーションの動作確認

`;
}

/**
 * ファイルシステムエラーのフォールバック処理
 */
async function generateFileSystemErrorFallback(): Promise<string> {
  return `⚠️ **注意:** ファイルシステムエラーによりVRTが失敗しました：

**確認事項:**
- ディスクの空き容量が十分にあるか
- ファイル・ディレクトリの権限が適切か
- 他のプロセスがファイルを使用していないか

手動でのスクリーンショット確認をお願いします。

`;
}

/**
 * ヘルスチェック結果を表示する
 */
export function displayHealthCheckResults(healthCheck: VRTHealthCheck): void {
  console.log('\n🔍 === VRT環境ヘルスチェック結果 ===');

  console.log('📋 基本環境:');
  console.log(`  Node.js: ${healthCheck.nodeInstalled ? '✅' : '❌'}`);
  console.log(`  npm: ${healthCheck.npmInstalled ? '✅' : '❌'}`);
  console.log(`  Playwright: ${healthCheck.playwrightInstalled ? '✅' : '❌'}`);
  console.log(`  tsx: ${healthCheck.tsxInstalled ? '✅' : '❌'}`);

  console.log('📁 プロジェクト構造:');
  console.log(
    `  構造有効性: ${healthCheck.projectStructureValid ? '✅' : '❌'}`,
  );
  console.log(
    `  VRT設定ファイル: ${healthCheck.vrtConfigExists ? '✅' : '❌'}`,
  );

  if (Object.keys(healthCheck.dependencies).length > 0) {
    console.log('📦 依存関係:');
    for (const [dep, installed] of Object.entries(healthCheck.dependencies)) {
      console.log(`  ${dep}: ${installed ? '✅' : '❌'}`);
    }
  }

  if (healthCheck.errors.length > 0) {
    console.log('❌ エラー:');
    for (const error of healthCheck.errors) {
      console.log(`  - ${error}`);
    }
  }

  if (healthCheck.warnings.length > 0) {
    console.log('⚠️ 警告:');
    for (const warning of healthCheck.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  console.log('=====================================\n');
}

// コマンドライン実行用のメイン関数
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--health-check') || args.includes('-h')) {
    const healthCheck = await performVRTHealthCheck();
    displayHealthCheckResults(healthCheck);

    // エラーがある場合は終了コード1で終了
    process.exit(healthCheck.errors.length > 0 ? 1 : 0);
  }

  if (args.includes('--help')) {
    console.log(`
Usage: tsx vrt-error-handler.ts [OPTIONS]

Options:
  --health-check, -h  VRT環境のヘルスチェックを実行
  --help              このヘルプを表示

Examples:
  tsx vrt-error-handler.ts --health-check  # 環境チェック
`);
    process.exit(0);
  }

  console.log('VRTエラーハンドラー: --help でオプションを確認してください');
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
