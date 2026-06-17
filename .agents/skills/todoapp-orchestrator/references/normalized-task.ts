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

type FactoryResult = {
  changedFiles: string[];
  updatedUnitTests: string[];
  integrationTest: IntegrationTestPlan;
};

type ReviewSeveritySummary = {
  critical: number;
  high: number;
  mediumLow: number;
};

type DraftPullRequestPlan = {
  draft: true; // Phase 7 では常に Draft PR を作成する
  baseBranch: string;
  headBranch: string;
  title: string;
  closesIssueNumber?: number;
};
