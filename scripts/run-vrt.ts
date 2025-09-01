#!/usr/bin/env tsx

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// プロジェクトルートディレクトリを取得
const projectRoot = process.cwd();

// VRTレポート関連のパス
const VRT_REPORT_DIR = path.join(projectRoot, 'playwright-report-vrt');
const VRT_RESULTS_DIR = path.join(
  projectRoot,
  'tests/vrt/pages.spec.ts-snapshots',
);
const VRT_OUTPUT_FILE = path.join(projectRoot, 'vrt-results.json');

interface VRTResult {
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  screenshots: string[];
  failedScreenshots: string[];
  reportPath?: string;
  errorMessage?: string;
}

/**
 * VRTテストを実行する
 */
async function runVRTTests(): Promise<VRTResult> {
  console.log('🔍 Visual Regression Testing を開始します...');

  return new Promise((resolve) => {
    // VRTテストを実行
    const vrtProcess = spawn(
      'npx',
      [
        'playwright',
        'test',
        '--config=playwright.vrt.config.ts',
        '--reporter=json',
      ],
      {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';

    vrtProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
      // リアルタイムでログ出力
      process.stdout.write(data);
    });

    vrtProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    vrtProcess.on('close', (code) => {
      console.log(`\n📊 VRT実行完了 (終了コード: ${code})`);

      try {
        // 結果を解析
        const result = parseVRTResults(stdout, stderr, code === 0);

        // 結果をJSONファイルに保存
        fs.writeFileSync(VRT_OUTPUT_FILE, JSON.stringify(result, null, 2));

        resolve(result);
      } catch (error) {
        const errorResult: VRTResult = {
          success: false,
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          screenshots: [],
          failedScreenshots: [],
          errorMessage: `VRT結果の解析でエラーが発生しました: ${error}`,
        };

        fs.writeFileSync(VRT_OUTPUT_FILE, JSON.stringify(errorResult, null, 2));
        resolve(errorResult);
      }
    });

    vrtProcess.on('error', (error) => {
      console.error('❌ VRT実行でエラーが発生しました:', error);
      const errorResult: VRTResult = {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        screenshots: [],
        failedScreenshots: [],
        errorMessage: `VRTプロセスでエラーが発生しました: ${error.message}`,
      };

      fs.writeFileSync(VRT_OUTPUT_FILE, JSON.stringify(errorResult, null, 2));
      resolve(errorResult);
    });
  });
}

/**
 * VRTテスト結果を解析する
 */
function parseVRTResults(
  stdout: string,
  _stderr: string,
  success: boolean,
): VRTResult {
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  const screenshots: string[] = [];
  const failedScreenshots: string[] = [];
  let reportPath: string | undefined;

  try {
    // JSON形式の結果を解析しようと試行
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonResult = JSON.parse(jsonMatch[0]);

      if (jsonResult.suites && Array.isArray(jsonResult.suites)) {
        for (const suite of jsonResult.suites) {
          if (suite.specs && Array.isArray(suite.specs)) {
            totalTests += suite.specs.length;

            for (const spec of suite.specs) {
              if (spec.tests && Array.isArray(spec.tests)) {
                for (const test of spec.tests) {
                  switch (test.status) {
                    case 'passed':
                      passedTests++;
                      break;
                    case 'failed':
                      failedTests++;
                      break;
                    case 'skipped':
                      skippedTests++;
                      break;
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch {
    console.log(
      '📝 JSON形式の解析に失敗しました。標準出力からテキスト形式で解析します。',
    );
  }

  // フォールバック: テキスト形式で結果を解析
  if (totalTests === 0) {
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (
        line.includes('passed') ||
        line.includes('failed') ||
        line.includes('skipped')
      ) {
        const numbers = line.match(/\d+/g);
        if (numbers) {
          if (line.includes('passed')) {
            passedTests = parseInt(numbers[0]) || 0;
          } else if (line.includes('failed')) {
            failedTests = parseInt(numbers[0]) || 0;
          } else if (line.includes('skipped')) {
            skippedTests = parseInt(numbers[0]) || 0;
          }
        }
      }
    }
    totalTests = passedTests + failedTests + skippedTests;
  }

  // スクリーンショットファイルを収集
  if (fs.existsSync(VRT_RESULTS_DIR)) {
    const collectScreenshots = (dir: string, basePath: string = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
          collectScreenshots(fullPath, relativePath);
        } else if (entry.name.endsWith('.png')) {
          screenshots.push(relativePath);

          // 失敗したスクリーンショット（差分）を識別
          if (entry.name.includes('-actual') || entry.name.includes('-diff')) {
            failedScreenshots.push(relativePath);
          }
        }
      }
    };

    collectScreenshots(VRT_RESULTS_DIR);
  }

  // HTMLレポートのパス
  if (fs.existsSync(VRT_REPORT_DIR)) {
    const indexPath = path.join(VRT_REPORT_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      reportPath = path.relative(projectRoot, indexPath);
    }
  }

  return {
    success: success && failedTests === 0,
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    screenshots,
    failedScreenshots,
    reportPath,
    errorMessage: success ? undefined : 'VRTテストで失敗が検出されました',
  };
}

/**
 * VRT結果のサマリーを表示する
 */
function displayVRTSummary(result: VRTResult) {
  console.log('\n📈 === VRT実行結果サマリー ===');
  console.log(`✅ 成功: ${result.success ? 'はい' : 'いいえ'}`);
  console.log(`📊 総テスト数: ${result.totalTests}`);
  console.log(`✅ 成功: ${result.passedTests}`);
  console.log(`❌ 失敗: ${result.failedTests}`);
  console.log(`⏭️ スキップ: ${result.skippedTests}`);
  console.log(`📸 スクリーンショット数: ${result.screenshots.length}`);

  if (result.failedScreenshots.length > 0) {
    console.log(
      `🚨 失敗したスクリーンショット: ${result.failedScreenshots.length}`,
    );
  }

  if (result.reportPath) {
    console.log(`📋 レポート: ${result.reportPath}`);
  }

  if (result.errorMessage) {
    console.log(`❌ エラー: ${result.errorMessage}`);
  }

  console.log('================================\n');
}

// メイン実行
async function main() {
  try {
    console.log('🚀 Visual Regression Testing ツールを開始します\n');

    const result = await runVRTTests();
    displayVRTSummary(result);

    // 結果によって適切な終了コードを設定
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ VRTツールでエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runVRTTests, parseVRTResults, displayVRTSummary };
export type { VRTResult };
