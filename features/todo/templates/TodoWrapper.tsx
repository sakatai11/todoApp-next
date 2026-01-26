'use client';

import { useEffect, useMemo, useState } from 'react';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Box } from '@mui/material';
import PushContainer from '@/features/todo/components/PushContainer/PushContainer';
import MainContainer from '@/features/todo/components/MainContainer/MainContainer';
import { TodoProvider } from '@/features/todo/contexts/TodoContext';
import useSWR, { SWRConfig, preload } from 'swr';
import TodosLoading from '@/app/(dashboards)/loading';
import ErrorDisplay from '@/features/todo/components/elements/Error/ErrorDisplay';
import { ErrorBoundary } from 'react-error-boundary';
import { useSession } from 'next-auth/react';
import { ERROR_MESSAGES } from '@/constants/errorMessages';

type TodoDataProps = {
  todos: TodoListProps[];
};

type ListDataProps = {
  lists: StatusListProps[];
};

// URLをuseMemoで固定化
const useApiUrls = () => {
  const baseUrl =
    typeof window === 'undefined' ? process.env.NEXTAUTH_URL || '' : '';

  return useMemo(
    () => ({
      // APIエンドポイント
      todos: `${baseUrl}/api/todos`,
      lists: `${baseUrl}/api/lists`,
    }),
    [baseUrl],
  );
};

// エミュレーターモード判定ヘルパー関数
const isEmulatorMode = () =>
  process.env.NEXT_PUBLIC_EMULATOR_MODE === 'true' &&
  process.env.NODE_ENV !== 'production';

// エラー情報を含むオブジェクトを返す関数
const createFetchError = (
  message: string,
  status: number,
  statusText: string,
) => {
  const error = new Error(message);
  return Object.assign(error, { status, statusText, isFetchError: true });
};

// 型ガード関数
const isFetchError = (
  err: unknown,
): err is Error & {
  status: number;
  statusText: string;
  isFetchError: true;
} => {
  if (!err || typeof err !== 'object') {
    return false;
  }

  const errorObj = err as Record<string, unknown>;
  return (
    'isFetchError' in errorObj &&
    errorObj.isFetchError === true &&
    'status' in errorObj &&
    typeof errorObj.status === 'number' &&
    'statusText' in errorObj &&
    typeof errorObj.statusText === 'string'
  );
};

const fetcher = async (url: string) => {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  // 開発・テスト環境ではX-User-IDヘッダーを追加
  if (isEmulatorMode()) {
    headers['X-User-ID'] =
      process.env.NEXT_PUBLIC_TEST_USER_UID || 'test-user-1';
  }

  const response = await fetch(url, {
    credentials: 'include', // セッション情報を送信
    headers,
  });

  if (!response.ok) {
    let message = `HTTP Error ${response.status}`;
    try {
      const ct = (response.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        const data = await response.json();
        message = data?.error || data?.message || message;
      } else {
        const text = await response.text();
        message = text || message;
      }
    } catch {
      // パースエラーや空レスポンスは無視してデフォルトメッセージ
    }
    throw createFetchError(message, response.status, response.statusText);
  }

  return response.json();
};

// データを取得するためのコンポーネント
const TodoContent = (): React.ReactElement => {
  const { data: session, status, update } = useSession();

  // 開発・テスト環境では認証をスキップ、本番環境では認証確立を待つ
  const emulatorMode = isEmulatorMode();
  const { todos: todosApiUrl, lists: listsApiUrl } = useApiUrls();
  const shouldFetch =
    emulatorMode || (status === 'authenticated' && Boolean(session?.user?.id));

  const [sessionGraceOver, setSessionGraceOver] = useState(false);

  // セッション待機の設定
  useEffect(() => {
    if (emulatorMode || typeof window === 'undefined') return;

    if (status === 'unauthenticated') {
      // unauthenticated状態になったら即座にセッション更新を試行
      const updateSession = async () => {
        try {
          const updated = await update();
          // update() が resolve しても未認証のまま（Session が null / user.id 不在）の場合はエラーへ
          if (!updated || !updated?.user?.id) {
            setSessionGraceOver(true);
          }
        } catch (error) {
          // セッション更新失敗時はエラー表示へ
          console.error('セッションの更新に失敗しました:', error);
          setSessionGraceOver(true);
        }
      };

      updateSession();
    } else {
      // 認証完了 or その他の状態に遷移したら待機状態をリセット
      setSessionGraceOver(false);
    }
  }, [emulatorMode, status, update]);

  // 安全な事前読み込み（クライアントサイドのみ）
  useEffect(() => {
    if (shouldFetch) {
      preload(todosApiUrl, fetcher);
      preload(listsApiUrl, fetcher);
    }
  }, [shouldFetch, todosApiUrl, listsApiUrl]);

  // 共通のSWRオプション
  const swrOptions = {
    revalidateOnMount: true,
    revalidateOnFocus: true, // タブ切り替え時に最新データ取得
    revalidateOnReconnect: true, // オフライン復帰時に再取得
    dedupingInterval: 2000, // 2秒以内の重複リクエストを防止
    focusThrottleInterval: 5000, // フォーカス時の再検証を5秒に1回に制限
    suspense: false,
    shouldRetryOnError: (err: Error) => {
      // FetchErrorの場合はステータスコードでチェック
      if (isFetchError(err)) {
        // 401 (Unauthorized) または 403 (Forbidden) の場合はリトライしない
        return err.status !== 401 && err.status !== 403;
      }
      // その他のエラーはリトライしない（ネットワークエラー等）
      return false;
    },
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  };

  const {
    data: todosData,
    error: todosError,
    isLoading: todosLoading,
  } = useSWR<TodoDataProps>(
    shouldFetch ? todosApiUrl : null,
    fetcher,
    swrOptions,
  );

  const {
    data: listsData,
    error: listsError,
    isLoading: listsLoading,
  } = useSWR<ListDataProps>(
    shouldFetch ? listsApiUrl : null,
    fetcher,
    swrOptions,
  );

  const isLoading = todosLoading || listsLoading;
  const error = todosError || listsError;

  // 認証中の場合はローディング表示
  if (!emulatorMode && status === 'loading') return <TodosLoading />;

  // 本番環境で未認証の場合は認証ページへリダイレクト
  // セッション同期の待機フラグを設ける
  if (!emulatorMode && status === 'unauthenticated') {
    if (typeof window !== 'undefined' && !sessionGraceOver) {
      return <TodosLoading />;
    }
    return <ErrorDisplay message={ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED} />;
  }

  // セッションはあるがcustomTokenがない場合（認証が不完全）
  if (!emulatorMode && status === 'authenticated' && !session?.user?.id) {
    return <ErrorDisplay message={ERROR_MESSAGES.AUTH.INCOMPLETE_AUTH} />;
  }

  if (error) return <ErrorDisplay message={error.message} />;
  if (isLoading || !todosData || !listsData) return <TodosLoading />;

  const { todos } = todosData;
  const { lists } = listsData;

  return (
    <TodoProvider initialTodos={todos} initialLists={lists}>
      <Box>
        <PushContainer />
        <MainContainer />
      </Box>
    </TodoProvider>
  );
};

// エラー境界のためのコンポーネント
const TodoErrorBoundary = ({ error }: { error: Error }) => {
  return <ErrorDisplay message={error.message} />;
};

// メインラッパーコンポーネント
const TodoWrapper = (): React.ReactElement => {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 2000, // 2秒以内の重複リクエストを防止
        focusThrottleInterval: 5000, // フォーカス時の再検証を5秒に1回に制限
      }}
    >
      <ErrorBoundary FallbackComponent={TodoErrorBoundary}>
        <TodoContent />
      </ErrorBoundary>
    </SWRConfig>
  );
};

export default TodoWrapper;
