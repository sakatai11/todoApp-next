# Shared Components Guidelines

## Shared Components Structure

```
shared/
├── components/       # Reusable components across features
│   └── elements/     # Generic UI elements
└── templates/        # Shared page templates
```

## Component Development Rules

### Reusability Principles
- Create components that can be used across multiple features
- Implement flexible prop interfaces
- Avoid feature-specific logic in shared components
- Use composition over inheritance

### UI Standards
- Follow Material-UI design principles
- Use Tailwind for consistent spacing and colors
- Implement proper TypeScript interfaces
- Support both light and dark themes

### Component Categories

#### Elements
- Basic UI components (buttons, inputs, cards)
- Layout components (containers, grids)
- Navigation components (menus, breadcrumbs)
- Feedback components (alerts, loaders)

#### Templates
- Page layout templates
- Modal/dialog templates
- Form layout templates
- Dashboard layout templates

## Development Guidelines

### Props Design
- Use descriptive prop names
- Implement default values where appropriate
- Support polymorphic components when needed
- Include proper JSDoc comments

### Styling Approach
- Use MUI's theming system
- Apply Tailwind utilities for spacing/colors
- Support responsive design
- Implement consistent hover/focus states

### Testing Requirements
- Create comprehensive component tests
- Test all prop variations
- Include accessibility tests
- Mock external dependencies
