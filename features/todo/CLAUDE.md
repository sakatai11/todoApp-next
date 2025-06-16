# Todo Feature Guidelines

## Feature Structure

```
todo/
├── contexts/          # TodoContext for state management
├── hooks/            # Custom hooks (useTodos, useLists, etc.)
├── components/       # Feature-specific components
│   └── elements/     # UI elements for todos
├── dnd/              # Drag-and-drop logic
└── templates/        # Todo page templates
```

## State Management Rules

### TodoContext Usage
- Always use TodoContext for todo state management
- Implement optimistic updates for better UX
- Handle loading and error states consistently
- Use SWR for server state synchronization

### Custom Hooks
- `useTodos()` for todo operations
- `useLists()` for list management
- Follow existing hook patterns
- Implement proper error handling

## Component Development

### UI Components
- Use MUI components as base
- Apply Tailwind for utility styling
- Maintain consistent design patterns
- Implement proper TypeScript interfaces

### Drag & Drop Implementation
- Use @dnd-kit/core for all drag & drop functionality
- Follow existing DnD patterns in `dnd/` folder
- Implement proper collision detection
- Handle drag end events consistently

## Data Flow

### API Integration
- Use `/api/(general)/todos/` endpoints
- Implement Zod validation for requests
- Handle authentication properly
- Use SWR for data fetching and caching

### State Updates
- Implement optimistic updates
- Revert on API errors
- Show loading states appropriately
- Handle concurrent updates
