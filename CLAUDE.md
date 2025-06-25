# Project Memory - Todo App Development Guidelines

**必ず日本語で回答してください**

## Project Overview

This is a Next.js 15 todo application using App Router with feature-based architecture.

### Development Commands

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Clean build (.next removal + build)
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint with auto-fix
npm run prettier        # Format code with Prettier
npm run format          # Run both prettier and lint

# Testing & Mocking
npm run msw:init        # Initialize Mock Service Worker
```

### Current Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Authentication**: NextAuth.js v5 (beta) with custom credentials provider
- **Backend**: Firebase Admin SDK (Firestore + Auth)
- **UI**: Material-UI (MUI) + Tailwind CSS
- **State Management**: React Context + SWR for data fetching
- **Drag & Drop**: @dnd-kit/core for task reordering
- **Validation**: Zod schemas
- **Testing**: Vitest + React Testing Library + MSW
- **Mocking**: MSW (Mock Service Worker)

### Current Directory Structure

```
app/                    # Next.js App Router
├── (admin)/           # Admin routes (grouped)
├── (auth)/            # Auth routes (grouped)
├── (dashboards)/      # Dashboard routes (grouped)
├── api/               # API routes
│   ├── (admin)/       # Admin APIs (grouped)
│   ├── (general)/     # General APIs (grouped)
│   └── auth/          # Auth APIs
└── libs/              # App-level utilities

features/              # Feature-based components
├── todo/              # Todo feature
│   ├── contexts/      # TodoContext for state management
│   ├── hooks/         # Custom hooks (useTodos, useLists, etc.)
│   ├── components/    # Feature-specific components
│   └── dnd/           # Drag & drop components
├── shared/            # Shared components across features
└── utils/             # Feature utilities

tests/                 # Test files and configuration
├── setup.ts           # Global test environment setup
├── test-utils.tsx     # Custom render functions and utilities
└── features/          # Feature-based test structure
    └── todo/          # Todo feature tests
        ├── contexts/  # Context provider tests
        ├── hooks/     # Custom hook tests
        └── components/ # Component tests

todoApp-submodule/     # Submodule for mock API and documentation
├── mocks/             # MSW handlers and mock data
│   ├── data/          # Mock data definitions
│   └── handlers/      # API handler definitions
└── docs/              # Project documentation

types/                 # TypeScript type definitions
```

### Authentication Flow

- NextAuth.js with custom credentials provider
- Firebase Admin SDK for server-side token verification
- Custom token exchange via `/api/auth/server-login`
- Role-based access control (admin/user roles)

### Data Management

- React Context (`TodoContext`) for todo state management
- SWR for server state management and caching
- Firebase Firestore as the database
- Optimistic updates for better UX

### API Structure

- Grouped routes using Next.js route groups `()`
- Separate admin and general user APIs
- Firebase Admin SDK for backend operations
- Zod validation for request/response data

### Important Project Notes

- TypeScript build errors are ignored in production (`ignoreBuildErrors: true`)
- Uses MSW for API mocking during development
- Vercel deployment configuration with cache control headers
- Feature-based architecture with clear separation of concerns

## Project-Specific Guidelines

### Directory Structure Rules
- **Follow feature-based architecture**: Each feature should be self-contained within the `features/` directory
- **Use App Router conventions**: Group related routes using Next.js route groups `()` 
- **Respect existing patterns**: Admin routes go in `(admin)/`, auth in `(auth)/`, dashboards in `(dashboards)/`
- **API organization**: Group APIs by functionality - `(admin)/`, `(general)/`, and `auth/`

### Authentication Implementation
- **Use NextAuth.js v5 patterns**: Follow the existing custom credentials provider setup
- **Firebase integration**: Use Firebase Admin SDK for server-side operations
- **Token handling**: Utilize the existing `/api/auth/server-login` endpoint for token exchange
- **Role-based access**: Maintain the admin/user role distinction

### State Management Patterns
- **TodoContext**: Use the existing React Context for todo state management
- **SWR integration**: Leverage SWR for server state management and caching
- **Optimistic updates**: Implement optimistic UI updates for better user experience
- **Error handling**: Follow existing error handling patterns in context providers

### Component Development
- **Material-UI usage**: Follow existing MUI component patterns and theming
- **Tailwind integration**: Use Tailwind for utility styling alongside MUI
- **Drag & Drop**: Use @dnd-kit/core following existing implementation patterns
- **Form validation**: Use Zod schemas for all form validation

### API Development
- **Grouped routes**: Use Next.js route groups for organization
- **Firebase operations**: Use Firebase Admin SDK for all backend operations
- **Request validation**: Implement Zod validation for all API requests/responses
- **Error responses**: Follow existing error response patterns

### Testing Guidelines

#### Quick Reference
- **Test Status**: ✅ 全テスト成功、100%カバレッジ達成
- **Testing Framework**: Vitest + React Testing Library + MSW
- **Test Commands**: `npm run test` (実行) / `npm run test:coverage` (カバレッジ) / `npm run test:ui` (UIモード)
- **Detailed Guide**: `tests/CLAUDE.md`を参照（テスト結果詳細・設定・ガイドライン）
