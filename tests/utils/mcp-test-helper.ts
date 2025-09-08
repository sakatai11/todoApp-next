/**
 * MCP (Playwright MCP) テスト支援ユーティリティ
 * 既存のE2Eテストと並行して動作するブラウザ自動化機能を提供
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

export interface MCPTestConfig {
  /** MCPサーバーのポート番号 (デフォルト: 3001) */
  port?: number;
  /** ブラウザタイプ */
  browser?: 'chrome' | 'firefox' | 'webkit';
  /** ヘッドレスモード */
  headless?: boolean;
  /** 出力ディレクトリ */
  outputDir?: string;
  /** セッション保存 */
  saveSession?: boolean;
  /** トレース保存 */
  saveTrace?: boolean;
  /** ビューポートサイズ */
  viewportSize?: string;
}

export class MCPTestHelper {
  private mcpProcess: ChildProcess | null = null;
  private config: Required<MCPTestConfig>;

  constructor(config: MCPTestConfig = {}) {
    this.config = {
      port: config.port ?? 3001,
      browser: config.browser ?? 'chrome',
      headless: config.headless ?? false,
      outputDir:
        config.outputDir ?? join(process.cwd(), 'tests', 'output', 'mcp'),
      saveSession: config.saveSession ?? true,
      saveTrace: config.saveTrace ?? true,
      viewportSize: config.viewportSize ?? '1280,720',
    };
  }

  /**
   * MCPサーバーを起動
   */
  async startMCPServer(): Promise<void> {
    const args = [
      '@playwright/mcp@latest',
      '--port',
      this.config.port.toString(),
      '--browser',
      this.config.browser,
      '--output-dir',
      this.config.outputDir,
      '--viewport-size',
      this.config.viewportSize,
    ];

    if (this.config.headless) {
      args.push('--headless');
    }

    if (this.config.saveSession) {
      args.push('--save-session');
    }

    if (this.config.saveTrace) {
      args.push('--save-trace');
    }

    return new Promise((resolve, reject) => {
      this.mcpProcess = spawn('npx', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });

      let output = '';

      this.mcpProcess.stdout?.on('data', (data) => {
        output += data.toString();
        // サーバー起動完了の判定
        if (
          output.includes('Server listening') ||
          output.includes('MCP server started')
        ) {
          resolve();
        }
      });

      this.mcpProcess.stderr?.on('data', (data) => {
        console.error('MCP Error:', data.toString());
      });

      this.mcpProcess.on('error', (error) => {
        reject(new Error(`MCPサーバー起動エラー: ${error.message}`));
      });

      // タイムアウト処理（30秒）
      setTimeout(() => {
        if (this.mcpProcess && !this.mcpProcess.killed) {
          reject(new Error('MCPサーバー起動がタイムアウトしました'));
        }
      }, 30000);
    });
  }

  /**
   * MCPサーバーを停止
   */
  async stopMCPServer(): Promise<void> {
    if (this.mcpProcess && !this.mcpProcess.killed) {
      return new Promise((resolve) => {
        this.mcpProcess!.on('close', () => {
          resolve();
        });
        this.mcpProcess!.kill('SIGTERM');

        // 強制終了のタイムアウト
        setTimeout(() => {
          if (this.mcpProcess && !this.mcpProcess.killed) {
            this.mcpProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000);
      });
    }
  }

  /**
   * 詳細なページ要素検証
   * 既存のPlaywrightテストでは困難な高度な要素検証を実行
   */
  async validatePageElements(
    pageUrl: string,
  ): Promise<ElementValidationResult> {
    // MCP APIを使用したページ要素の詳細検証
    // 実装は後続で追加予定
    return {
      url: pageUrl,
      timestamp: new Date().toISOString(),
      elements: [],
      accessibility: {
        score: 0,
        issues: [],
      },
      performance: {
        loadTime: 0,
        renderTime: 0,
      },
    };
  }

  /**
   * スクリーンショット取得・比較機能
   */
  async captureAndCompare(
    testName: string,
    expectedPath?: string,
  ): Promise<ScreenshotResult> {
    // MCPを使用したスクリーンショット機能
    // 実装は後続で追加予定
    return {
      testName,
      screenshotPath: join(this.config.outputDir, `${testName}.png`),
      timestamp: new Date().toISOString(),
      comparison: expectedPath
        ? {
            expectedPath,
            diffPath: join(this.config.outputDir, `${testName}-diff.png`),
            similarity: 0,
            passed: false,
          }
        : undefined,
    };
  }

  /**
   * 高度なユーザーインタラクション検証
   */
  async validateUserInteractions(
    interactions: InteractionTest[],
  ): Promise<InteractionResult[]> {
    // MCP APIを使用した高度なインタラクション検証
    // 実装は後続で追加予定
    return interactions.map((interaction) => ({
      name: interaction.name,
      type: interaction.type,
      passed: false,
      duration: 0,
      details: '',
    }));
  }

  /**
   * E2Eテストとの並行デバッグ機能
   * 既存のPlaywrightテスト実行中に詳細情報を収集
   */
  async debugParallelTest(testFile: string): Promise<DebugResult> {
    // 既存テスト並行実行時のデバッグ情報収集
    // 実装は後続で追加予定
    return {
      testFile,
      timestamp: new Date().toISOString(),
      browserState: {
        url: '',
        title: '',
        cookies: [],
        localStorage: {},
        sessionStorage: {},
      },
      networkActivity: [],
      consoleMessages: [],
      errors: [],
    };
  }
}

// 型定義
export interface ElementValidationResult {
  url: string;
  timestamp: string;
  elements: ElementInfo[];
  accessibility: {
    score: number;
    issues: string[];
  };
  performance: {
    loadTime: number;
    renderTime: number;
  };
}

export interface ElementInfo {
  selector: string;
  tagName: string;
  visible: boolean;
  attributes: Record<string, string>;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ScreenshotResult {
  testName: string;
  screenshotPath: string;
  timestamp: string;
  comparison?: {
    expectedPath: string;
    diffPath: string;
    similarity: number;
    passed: boolean;
  };
}

export interface InteractionTest {
  name: string;
  type: 'click' | 'hover' | 'drag' | 'scroll' | 'type';
  selector: string;
  options?: Record<string, unknown>;
}

export interface InteractionResult {
  name: string;
  type: string;
  passed: boolean;
  duration: number;
  details: string;
}

export interface DebugResult {
  testFile: string;
  timestamp: string;
  browserState: {
    url: string;
    title: string;
    cookies: Array<{ name: string; value: string }>;
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
  };
  networkActivity: NetworkRequest[];
  consoleMessages: ConsoleMessage[];
  errors: TestError[];
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
  timestamp: string;
}

export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
}

export interface TestError {
  message: string;
  stack?: string;
  timestamp: string;
}

// デフォルトエクスポート
export default MCPTestHelper;
