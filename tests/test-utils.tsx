import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { SessionProvider } from 'next-auth/react';
import { TodoProvider } from '@/features/todo/contexts/TodoContext';
import { TodoListProps } from '@/types/todos';
import { StatusListProps } from '@/types/lists';
import { Timestamp } from 'firebase-admin/firestore';
import { todos as submoduleTodos } from '@/todoApp-submodule/mocks/data/todos';
import { lists as submoduleLists } from '@/todoApp-submodule/mocks/data/lists';
import { mockUser as submoduleMockUser } from '@/todoApp-submodule/mocks/data/user';

// Mock missing hooks
import { vi } from 'vitest';

vi.mock('@/features/todo/hooks/useUpdateStatusAndCategory', () => ({
  useUpdateStatusAndCategory: () => ({
    editId: null,
    editList: vi.fn(),
    setEditId: vi.fn(),
    updateStatusAndCategory: vi.fn(),
  }),
}));

vi.mock('@/features/todo/hooks/useDeleteList', () => ({
  useDeleteList: () => ({
    deleteList: vi.fn(),
  }),
}));

// MUI Theme for testing
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Mock session data
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
  },
  expires: '2025-12-31',
};

// Convert submodule mock data to Firebase Timestamp format
const convertMockTodosToTimestamp = (): TodoListProps[] => {
  return submoduleTodos.map((todo) => ({
    ...todo,
    createdTime: Timestamp.fromDate(new Date(todo.createdTime)),
    updateTime: Timestamp.fromDate(new Date(todo.updateTime)),
  }));
};

// Mock initial data using submodule data
export const mockTodos: TodoListProps[] = convertMockTodosToTimestamp();

// Use submodule list data directly
export const mockLists: StatusListProps[] = submoduleLists;

// Convert submodule mock user to UserData format
const convertMockUserToUserData = () => {
  const userData = submoduleMockUser[0]; // 最初のユーザーデータを使用
  return {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    createdAt: Timestamp.fromDate(new Date(userData.createdAt)),
    name: 'Test User', // デフォルト名
    image: 'https://example.com/avatar.jpg', // デフォルト画像
  };
};

// Use submodule user data
export const mockUser = convertMockUserToUserData();

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withTodoProvider?: boolean;
  withSession?: boolean;
  initialTodos?: TodoListProps[];
  initialLists?: StatusListProps[];
  todoContextOverrides?: Record<string, unknown>;
}

const customRender = (
  ui: ReactElement,
  {
    withTodoProvider = true,
    withSession = true,
    initialTodos = mockTodos,
    initialLists = mockLists,
    ...renderOptions
  }: CustomRenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    let component = (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );

    if (withSession) {
      component = (
        <SessionProvider session={mockSession}>{component}</SessionProvider>
      );
    }

    if (withTodoProvider) {
      component = (
        <TodoProvider initialTodos={initialTodos} initialLists={initialLists}>
          {component}
        </TodoProvider>
      );
    }

    return component;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper function to create test props
export const createTestTodo = (
  overrides: Partial<TodoListProps> = {},
): TodoListProps => ({
  id: 'test-todo-id',
  text: 'Test Todo',
  status: 'pending',
  bool: false,
  createdTime: Timestamp.fromDate(new Date()),
  updateTime: Timestamp.fromDate(new Date()),
  ...overrides,
});

export const createTestList = (
  overrides: Partial<StatusListProps> = {},
): StatusListProps => ({
  id: 'test-list-id',
  category: 'pending',
  number: 1,
  ...overrides,
});
