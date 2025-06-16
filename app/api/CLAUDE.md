# API Development Guidelines

## API Structure

```
api/
├── (admin)/          # Admin-only APIs
├── (general)/        # General user APIs
└── auth/            # Authentication APIs
```

## Implementation Rules

### Route Organization
- Use Next.js route groups `()` for organization
- Admin APIs require admin role verification
- General APIs require user authentication
- Auth APIs handle authentication flow

### Request/Response Handling
- Use Zod schemas for validation
- Implement consistent error responses
- Return appropriate HTTP status codes
- Handle authentication in middleware

### Firebase Integration
- Use Firebase Admin SDK for all operations
- Implement proper error handling
- Use transactions for complex operations
- Handle Firestore security rules

### Error Response Format
```typescript
{
  error: string;
  message: string;
  statusCode: number;
}
```

### Authentication Requirements
- Verify JWT tokens with Firebase Admin SDK
- Check user roles for admin endpoints
- Handle expired tokens appropriately
- Implement rate limiting where needed
