type NormalizedTask = {
  type: 'feature' | 'bugfix' | 'ui-change' | 'optimization';
  source: 'spec' | 'qa' | 'github-issue' | 'ui-annotator' | 'posthog';
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
