type TaskType = 'feature' | 'bugfix' | 'ui-change' | 'optimization';

type TaskSource = 'spec' | 'qa' | 'github-issue' | 'ui-annotator' | 'posthog';

type NormalizedTask = {
  type: TaskType;
  source: TaskSource;
  title: string; // PR タイトルの素材（最大72文字）
  description: string; // 実装するべき内容（50文字以上）
  acceptanceCriteria: string[]; // 完了条件（1件以上必須）
  context?: {
    issueNumber?: number;
    specPath?: string;
    screenshotPath?: string;
    posthogQuery?: string;
    reproSteps?: string[]; // bugfix 時に必須
    relatedDocs?: string[]; // Phase 1-3 で収集した関連仕様書パス
  };
  branchSlug: string; // slug のみ（kebab-case）。ブランチ名は Phase 2 で `<type>/<branchSlug>` として構築する
};

type IntegrationTestReason =
  | 'api-route-changed'
  | 'firebase-auth-changed'
  | 'firestore-changed';

type IntegrationTestPlan =
  | {
      required: true;
      reasons: IntegrationTestReason[];
      changedApiRoutes?: string[];
    }
  | {
      required: false;
      reason: 'docs-only' | 'skill-only' | 'frontend-only';
    };

// todoapp-backlog-loop -> loop-creator 経由で orchestrator を起動する場合、
// 親 loop が creator 委譲前にユーザー承認を取り、その承認済みプロンプトを渡す。
// 通常の単体 orchestrator 実行では undefined のまま Phase 3a の Y/N/E 承認ゲートを使う。
type LoopApprovedPrompt = {
  approvedBy: 'loop-parent';
  approvedAt: string; // ISO-8601
  approvalSummary: string;
  prompt: string;
};

// Phase 3a（Claude 設計）が出力する実装指示書の置き場所。
// 実体は `.codex-tasks/<branchSlug>.md`（.gitignore 済み）。Phase 3b の Codex がこれを読んで実装する。
type DesignDocPlan = {
  designDocPath: string; // 例: '.codex-tasks/add-list-empty-state.md'
  // 設計セレモニーの重さ。Phase 1 の規模判定（feature.md 等の大規模/小〜中規模）に対応する。
  // - 'full': explorer/architect を複数 fan-out した上でフル指示書を生成
  // - 'light': Claude 単発スコープ確定で最小指示書（1セクション）を生成。アーキ選択ゲートは省略
  lane: 'full' | 'light';
  approvedByHuman: boolean; // 指示書承認ゲート（Y/N/E）を通過したか。false のまま Phase 3b に進まない
  loopApprovedPrompt?: LoopApprovedPrompt; // loop 経由ではこれを承認済み入力として扱い、同じ内容の再承認をしない
};

// Phase 3b（Codex 実装）が返す完了サマリーの契約。
// 実装は `codex exec` をバックグラウンド起動し、その最終メッセージ（= 500 トークン以内のサマリー）を
// `-o .codex-tasks/<branchSlug>.result.md` に書き出す。orchestrator はこのファイルだけを読んでこの構造にマップする
// （冗長な実装ログは `.codex-tasks/<branchSlug>.log` に隔離されメインコンテキストには載らない）。
// changedFiles は自己申告であり、コミット対象は常に実 diff（git status）を正とする。
type CodexImplementationResult = {
  changedFiles: string[]; // Codex 自己申告。実 diff と食い違う場合は実 diff を採用
  updatedUnitTests: string[];
  // Codex が指示書どおり format → lint → test:run → build の自己修正ループを緑にしたかの自己申告。
  // orchestrator は Phase 4 でこれを鵜呑みにせず最終ゲートを 1 回決定論再実行する。
  selfGateReportedGreen: boolean;
  integrationTest: IntegrationTestPlan;
};

// Phase 3 全体の結果。3a の設計指示書（designDoc）と 3b の Codex 実装結果（codex）をまとめて Phase 4 へ渡す。
// 変更ファイル・UT・IT 判定は CodexImplementationResult（codex 配下）を単一の正とし、トップレベルへ二重化しない。
// 集約ビューを重複定義すると同期漏れで不整合を起こすため、後続 Phase は `codex.*` / `designDoc.*` を直接参照する。
type FactoryResult = {
  designDoc: DesignDocPlan;
  codex: CodexImplementationResult;
};

type DraftPullRequestPlan = {
  draft: true; // Phase 7 では常に Draft PR を作成する
  baseBranch: string;
  headBranch: string;
  title: string;
  closesIssueNumber?: number;
};
