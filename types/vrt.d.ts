// VRT (Visual Regression Testing) 用の型定義

declare global {
  interface Window {
    __VRT_MOCK_AUTH__: boolean;
  }
}

export {};
