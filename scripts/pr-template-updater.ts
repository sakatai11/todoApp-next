#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import type { VRTResult } from './run-vrt.js';

// プロジェクトルートディレクトリを取得
const projectRoot = process.cwd();

// ファイルパス
const VRT_RESULTS_FILE = path.join(projectRoot, 'vrt-results.json');
const PR_TEMPLATE_PATH = path.join(
  projectRoot,
  '.github/pull_request_template.md',
);
const TEMP_PR_TEMPLATE = path.join(projectRoot, '.github/temp_pr_template.md');

interface PRTemplateUpdaterOptions {
  skipVrt?: boolean;
  vrtResultsPath?: string;
  outputPath?: string;
}

/**
 * VRT結果を基にPRテンプレートを更新する
 */
export async function updatePRTemplate(
  options: PRTemplateUpdaterOptions = {},
): Promise<string> {
  const {
    skipVrt = false,
    vrtResultsPath = VRT_RESULTS_FILE,
    outputPath = TEMP_PR_TEMPLATE,
  } = options;

  console.log('📝 PR テンプレートを更新中...');

  // PRテンプレートの存在確認
  if (!fs.existsSync(PR_TEMPLATE_PATH)) {
    throw new Error(`PR テンプレートが見つかりません: ${PR_TEMPLATE_PATH}`);
  }

  // PRテンプレートを読み込み
  const templateContent = fs.readFileSync(PR_TEMPLATE_PATH, 'utf-8');

  // VRT結果コンテンツを生成
  let vrtContent: string;

  if (skipVrt) {
    vrtContent = generateVrtSkipContent();
  } else {
    vrtContent = await generateVrtContent(vrtResultsPath);
  }

  // スクリーンショットセクションを置き換え
  const updatedContent = insertVrtContent(templateContent, vrtContent);

  // 更新されたテンプレートを保存
  fs.writeFileSync(outputPath, updatedContent);

  console.log(`✅ PR テンプレートが更新されました: ${outputPath}`);

  return outputPath;
}

/**
 * VRT結果コンテンツを生成する
 */
async function generateVrtContent(vrtResultsPath: string): Promise<string> {
  if (!fs.existsSync(vrtResultsPath)) {
    console.warn(`⚠️ VRT 結果ファイルが見つかりません: ${vrtResultsPath}`);
    return generateVrtErrorContent('VRT結果ファイルが見つかりませんでした');
  }

  try {
    const vrtResultJson = fs.readFileSync(vrtResultsPath, 'utf-8');
    const vrtResult: VRTResult = JSON.parse(vrtResultJson);

    return generateVrtSuccessContent(vrtResult);
  } catch (error) {
    console.error('❌ VRT結果の解析でエラーが発生しました:', error);
    return generateVrtErrorContent(
      `VRT結果の解析でエラーが発生しました: ${error}`,
    );
  }
}

/**
 * VRT成功時のコンテンツを生成する
 */
function generateVrtSuccessContent(result: VRTResult): string {
  let content = '### 📸 Visual Regression Test (VRT) 結果\n\n';

  if (result.success) {
    content += '✅ **VRT テスト: 成功**\n\n';
  } else {
    content += '❌ **VRT テスト: 失敗**\n\n';
  }

  // テスト結果テーブル
  content += '| 項目 | 値 |\n';
  content += '|------|-----|\n';
  content += `| 総テスト数 | ${result.totalTests} |\n`;
  content += `| 成功 | ${result.passedTests} |\n`;
  content += `| 失敗 | ${result.failedTests} |\n`;
  content += `| スクリーンショット数 | ${result.screenshots.length} |\n`;

  if (result.failedScreenshots.length > 0) {
    content += `| 失敗したスクリーンショット | ${result.failedScreenshots.length} |\n`;
  }

  if (result.reportPath) {
    content += `| レポート | \`${result.reportPath}\` |\n`;
  }

  content += '\n';

  // エラーメッセージ
  if (result.errorMessage) {
    content += '**エラー詳細:**\n';
    content += '```\n';
    content += result.errorMessage;
    content += '\n```\n\n';
  }

  // 失敗スクリーンショットの警告
  if (result.failedScreenshots.length > 0) {
    content +=
      '⚠️ **注意:** VRT で差分が検出されています。レポートを確認して、意図した変更かどうかを確認してください。\n\n';

    // 失敗したスクリーンショットのリスト
    content += '**失敗したスクリーンショット:**\n';
    for (const screenshot of result.failedScreenshots) {
      content += `- \`${screenshot}\`\n`;
    }
    content += '\n';
  }

  // スクリーンショット一覧（成功したもの）
  if (result.screenshots.length > result.failedScreenshots.length) {
    content += '<details>\n';
    content += '<summary>📸 生成されたスクリーンショット</summary>\n\n';

    for (const screenshot of result.screenshots) {
      if (!result.failedScreenshots.includes(screenshot)) {
        content += `- \`${screenshot}\`\n`;
      }
    }

    content += '\n</details>\n\n';
  }

  return content;
}

/**
 * VRT スキップ時のコンテンツを生成する
 */
function generateVrtSkipContent(): string {
  return `### 📸 Visual Regression Test (VRT) 結果

⏭️ **VRT テスト: スキップ**

VRT テストは \`--skip-vrt\` オプションによりスキップされました。

`;
}

/**
 * VRT エラー時のコンテンツを生成する
 */
function generateVrtErrorContent(errorMessage: string): string {
  return `### 📸 Visual Regression Test (VRT) 結果

❌ **VRT テスト: エラー**

VRT テスト実行中にエラーが発生しました。

**エラー詳細:**
\`\`\`
${errorMessage}
\`\`\`

`;
}

/**
 * PRテンプレートにVRTコンテンツを挿入する
 */
function insertVrtContent(templateContent: string, vrtContent: string): string {
  // スクリーンショットセクションを探す
  const screenshotSectionRegex =
    /## スクリーンショット（必要に応じて）[\s\S]*?(?=## |$)/;
  const match = templateContent.match(screenshotSectionRegex);

  if (!match) {
    console.warn(
      '⚠️ スクリーンショットセクションが見つかりません。末尾にVRT結果を追加します。',
    );
    return templateContent + '\n' + vrtContent;
  }

  // スクリーンショットセクションを置き換え
  const replacement = `## スクリーンショット（必要に応じて）

<!-- UI変更がある場合、Before/Afterのスクリーンショットを添付してください -->

${vrtContent}`;

  return templateContent.replace(screenshotSectionRegex, replacement);
}

/**
 * 一時的なPRテンプレートをクリーンアップする
 */
export function cleanupTempTemplate(
  tempTemplatePath: string = TEMP_PR_TEMPLATE,
): void {
  if (fs.existsSync(tempTemplatePath)) {
    fs.unlinkSync(tempTemplatePath);
    console.log(`🗑️ 一時PRテンプレートを削除しました: ${tempTemplatePath}`);
  }
}

// コマンドライン実行用のメイン関数
async function main() {
  const args = process.argv.slice(2);

  let skipVrt = false;
  let vrtResultsPath = VRT_RESULTS_FILE;
  let outputPath = TEMP_PR_TEMPLATE;

  // 引数解析
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--skip-vrt':
        skipVrt = true;
        break;
      case '--vrt-results':
        vrtResultsPath = args[i + 1];
        i++;
        break;
      case '--output':
        outputPath = args[i + 1];
        i++;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: tsx pr-template-updater.ts [OPTIONS]

Options:
  --skip-vrt           VRT テストをスキップした場合のコンテンツを生成
  --vrt-results PATH   VRT結果JSONファイルのパス (default: ${VRT_RESULTS_FILE})
  --output PATH        出力先パス (default: ${TEMP_PR_TEMPLATE})
  --help, -h          このヘルプを表示
`);
        process.exit(0);
      default:
        console.error(`不明なオプション: ${args[i]}`);
        process.exit(1);
    }
  }

  try {
    await updatePRTemplate({
      skipVrt,
      vrtResultsPath,
      outputPath,
    });

    console.log('🎉 PR テンプレートの更新が完了しました！');
  } catch (error) {
    console.error('❌ PR テンプレートの更新でエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
