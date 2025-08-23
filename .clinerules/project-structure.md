# Project Structure

This section provides an overview of the folder structure used in this project, designed to be modular, scalable, and easy to maintain.

We follow a feature-based and App Router-oriented architecture using Next.js 15. Each directory serves a clear purpose: separating concerns like UI, business logic, API routes, static content, and reusable types.

## features/

This directory organizes the app into logical features such as todo, sign, top, and admin. Each feature has subfolders for UI components, templates, and logic (e.g., hooks, contexts, DnD logic). This makes each feature self-contained and easy to scale.

## tests/

This directory contains a comprehensive testing environment using Vitest and modern testing frameworks. The test suite achieves 100% pass rate with high code coverage and follows feature-based organization that mirrors the main application structure. It includes unit tests with MSW (Mock Service Worker) for API mocking, integration tests using Docker and Firebase Emulator environment, and end-to-end tests with Playwright for complete user workflow validation.

## app/

This is where the actual routing and rendering logic resides, structured by Next.js App Router conventions. Grouped routes like (auth) or (admin) allow cleaner separation between different parts of the application without polluting the URL.

## api/

All server functions (APIs) live here, further divided into general, admin, and auth routes. This separation ensures better access control and clearer codebase navigation.

## types/, data/, public/

These directories store cross-cutting concerns such as reusable types, static data (e.g., form definitions or validation rules), and assets like images or CSS. They help in maintaining clarity across the project by centralizing shared resources.

## todoApp-submodule/

The todoApp-submodule is a support module designed to centralize mock API management and documentation, improving development efficiency and team collaboration. It is primarily composed of the following two directories:

### mocks/

This directory centralizes mock API definitions using MSW (Mock Service Worker). It includes environment-specific setup files like browser.ts and server.ts, mock data such as todos.ts and user.ts, and API handlers like auth.ts and lists.ts. This structure enables frontend development to proceed independently, even when the backend is not yet implemented.

### docs/

This directory organizes the project's specifications and technical documents in a structured manner. Documentation is categorized by API, mock, and feature scope, including files such as MOCK.md and api/auth.md. Closely integrated with todoApp-submodule, it serves as a centralized knowledge base that supports design consistency and effective team communication.

```
todoApp-next/
├── app/                        # App Router-based route definitions for Next.js
│   ├── (admin)/                # Grouped routes related to admin
│   │   └── admin/              # Admin page
│   │       └── page.tsx
│   ├── (auth)/                 # Grouped routes related to authentication
│   │   ├── _signIn/            # Logic for signing in
│   │   │   └── signIn.ts
│   │   ├── _signOut/           # Logic for signing out
│   │   │   └── signOut.ts
│   │   ├── _signUp/            # Logic for signing up
│   │   │   └── signUp.ts
│   │   ├── account/            # Account-related pages
│   │   │   └── error/          # Account error page
│   │   │       └── page.tsx
│   │   ├── signin/             # Sign-in page
│   │   │   └── page.tsx
│   │   └── signup/             # Sign-up page
│   │       └── page.tsx
│   ├── (dashboards)/           # Grouped routes for dashboards
│   │   ├── loading.tsx         # Loading screen for dashboard
│   │   └── todo/               # Task management page
│   │       └── page.tsx
│   ├── api/                    # API routes
│   │   ├── (admin)/            # Admin API
│   │   │   └── users/          # Admin user API
│   │   │       ├── [userId]/   # API for specific user
│   │   │       │   ├── lists/  # List management API for a user
│   │   │       │   │   └── route.ts
│   │   │       │   └── todos/  # Todo management API for a user
│   │   │       │       └── route.ts
│   │   │       └── route.ts
│   │   ├── (general)/          # General user API
│   │   │   ├── dashboards/     # Content information API
│   │   │   │   └── route.ts
│   │   │   ├── lists/          # List management API
│   │   │   │   └── route.ts
│   │   │   ├── todos/          # Todo management API
│   │   │   │   └── route.ts
│   │   │   └── user/           # User info API
│   │   │       └── route.ts
│   │   ├── auth/               # Authentication-related APIs
│   │   │   ├── [...nextauth]/  # NextAuth.js API handler
│   │   │   ├── refresh/        # Token refresh API
│   │   │   │   └── route.ts
│   │   │   └── server-login/   # Server-side login API
│   │   │       └── route.ts
│   ├── libs/                   # Shared libraries
│   ├── providers/              # React providers
│   │   ├── MSWProvider.tsx     # Mock Service Worker provider
│   │   └── SessionProvider.tsx # Session management provider
│   ├── static/                 # Static CSS files
│   │   ├── input.css
│   │   └── output.css
│   └── utils/                  # Utility functions
├── features/                   # Feature-specific components and logic
│   ├── admin/                  # Admin-related features
│   │   ├── components/         # Admin UI components
│   │   └── templates/          # Admin UI templates
│   ├── libs/                   # Shared libraries
│   ├── shared/                 # Shared features across the app
│   │   ├── components/         # Common UI components
│   │   │   └── elements/       # Generic UI elements
│   │   └── templates/          # Shared templates
│   ├── sign/                   # Sign-in/Sign-up features
│   │   ├── components/         # Auth-related UI components
│   │   │   └── elements/       # Auth-specific UI elements
│   │   └── templates/          # Auth templates
│   ├── todo/                   # Todo feature
│   │   ├── components/         # UI components for todos
│   │   │   └── elements/       # UI elements for todos
│   │   ├── contexts/           # Context for todo state
│   │   ├── dnd/                # Drag-and-drop logic
│   │   ├── hooks/              # Custom hooks for todo
│   │   └── templates/          # Todo page templates
│   ├── top/                    # Top page feature
│   │   ├── components/         # Top page UI components
│   │   └── templates/          # Top page templates
│   └── utils/                  # Shared utilities across features
├── data/                       # Static data and link definitions
│   ├── form.ts                 # Form definitions
│   ├── validatedData.ts        # Validated data
│   └── links/                  # External link definitions
├── public/                     # Static assets such as images
├── scripts/                    # Project utility scripts
│   ├── init-firebase-data.ts   # Firebase Emulator data initialization (tsx execution)
│   ├── cleanup-db.ts           # Test database cleanup
│   └── helpers/                # Helper functions for scripts
│       └── testDbDataFetcher.ts # Test data fetching utilities
├── tests/                      # Comprehensive testing suite
│   ├── setup.ts                # Global unit test environment setup
│   ├── setup-integration.ts    # Integration test environment setup
│   ├── test-utils.tsx          # Custom render functions and test utilities
│   ├── features/               # Feature-based test structure
│   │   ├── utils/              # Utility function tests (4 files)
│   │   ├── shared/             # Shared component tests
│   │   │   └── components/     # Navigation and common component tests
│   │   ├── todo/               # Todo feature comprehensive testing
│   │   │   ├── api.integration.test.ts    # Todo API integration tests
│   │   │   ├── contexts/                  # TodoContext tests
│   │   │   ├── components/                # Todo component tests (13 files)
│   │   │   │   ├── elements/              # UI element tests (Status, TodoList, Add, Modal, Error)
│   │   │   │   ├── PushContainer/         # Container component tests
│   │   │   │   └── MainContainer/         # Main container tests
│   │   │   ├── hooks/                     # Todo custom hooks tests (4 files)
│   │   │   └── templates/                 # TodoWrapper template tests
│   │   └── libs/               # Common library tests
│   ├── e2e/                    # End-to-end testing with Playwright
│   │   ├── global-setup.ts     # E2E test global setup
│   │   ├── global-teardown.ts  # E2E test global cleanup
│   │   └── todo-flow.spec.ts   # Comprehensive todo workflow E2E tests
│   └── fixtures/               # Test fixtures for Firebase Emulator
│       ├── auth_export/        # Authentication data export
│       └── firestore_export/   # Firestore data export
├── todoApp-submodule/
│   ├── mocks/                 # Form definitions
│   │   ├── browser.ts              # MSW browser configuration
│   │   ├── server.ts               # MSW Node.js configuration
│   │   ├── initMocks.ts            # Mock initialization
│   │   ├── data/                   # Mock data definitions
│   │   │   ├── index.ts            # Data exports
│   │   │   ├── lists.ts            # List mock data
│   │   │   ├── todos.ts            # Todo mock data
│   │   │   └── user.ts             # User mock data
│   │   └── handlers/               # API handler definitions
│   │       ├── index.ts            # Handler exports
│   │       ├── auth.ts             # Authentication API handlers
│   │       ├── dashboard.ts        # Dashboard API handlers
│   │       ├── lists.ts            # List API handlers
│   │       └── todos.ts            # Todo API handlers
│   └──  docs/                      # It contains project-wide documentation such as API specifications, feature overviews, and mock API details.
│
└── types/                      # TypeScript type definitions
    ├── common.ts               # Common types
    ├── components.ts           # Component-related types
    ├── lists.ts                # List-related types
    ├── next-auth.d.ts          # Types for NextAuth.js
    ├── todos.ts                # Todo-related types
    ├── auth/                   # Auth-specific types
    ├── form/                   # Form-specific types
    └── markdown/               # Markdown-related types
```
