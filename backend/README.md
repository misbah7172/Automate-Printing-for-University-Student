# AutoPrint Backend

Node.js backend API server for the AutoPrint system, providing authentication, document management, payment processing, and print job orchestration.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Document Management**: File upload to S3, document processing, and metadata extraction
- **Payment Processing**: Stripe integration and user balance management
- **Print Job Management**: Queue management and status tracking
- **Admin Dashboard**: User management, analytics, and system monitoring
- **Database Integration**: PostgreSQL with Sequelize ORM
- **File Storage**: AWS S3 integration for document storage
- **Real-time Updates**: Redis for caching and session management

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT
- **Payment Processing**: Stripe
- **File Storage**: AWS S3
- **Caching**: Redis
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI (planned)

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp ../.env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   # Start PostgreSQL (via Docker Compose)
   cd ../infra
   docker-compose up -d postgres

   # Run migrations
   npm run db:migrate
   
   # Seed database (optional)
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   npm run test:coverage
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/balance` - Get user balance

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List user documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document

### Print Jobs
- `POST /api/print-jobs` - Create print job
- `GET /api/print-jobs` - List user print jobs
- `GET /api/print-jobs/:id` - Get print job details
- `PUT /api/print-jobs/:id/cancel` - Cancel print job

### Payments
- `POST /api/payments/create` - Create payment
- `POST /api/payments/:id/process` - Process payment
- `GET /api/payments` - List user payments
- `POST /api/payments/:id/refund` - Refund payment

### Admin (Admin/Operator only)
- `GET /api/admin/dashboard` - System statistics
- `GET /api/admin/users` - Manage users
- `GET /api/admin/print-jobs` - All print jobs
- `GET /api/admin/payments` - All payments
- `GET /api/admin/reports/*` - Various reports

## Database Schema

### Users
- Authentication and profile information
- Role-based access control (student, admin, operator)
- Balance tracking for payments

### Documents
- File metadata and S3 references
- Processing status and page counting
- Soft deletion support

### Print Jobs
- Print options and cost calculation
- Status tracking through print lifecycle
- Printer assignment and failure handling

### Payments
- Multi-method payment support (card, balance, cash)
- Stripe integration for card payments
- Refund and dispute handling

## Using GitHub Copilot for Development

This backend is structured to work excellently with GitHub Copilot:

### 1. API Endpoint Development
```javascript
// Example: Use Copilot to expand this comment into a full endpoint
// Create endpoint to get print statistics for a user
router.get('/stats', asyncHandler(async (req, res) => {
  // Copilot will suggest the implementation
}));
```

### 2. Database Queries
```javascript
// Example: Copilot can help with complex Sequelize queries
// Find all print jobs with their documents and payments for admin dashboard
const printJobs = await PrintJob.findAll({
  // Copilot will suggest include, where, order options
});
```

### 3. Service Layer Expansion
```javascript
// Example: Create new services by describing functionality
// Service to handle document conversion to different formats
const convertDocument = async (documentId, targetFormat) => {
  // Copilot will suggest implementation
};
```

### 4. Middleware Creation
```javascript
// Example: Create custom middleware with Copilot
// Middleware to log all API requests with user context
const requestLogger = (req, res, next) => {
  // Copilot will suggest logging implementation
};
```

### 5. Testing
```javascript
// Example: Generate comprehensive tests
describe('Print Job API', () => {
  // Copilot can generate multiple test cases
  test('should create print job with valid document', async () => {
    // Implementation suggestions
  });
});
```

## Development Guidelines

### Code Organization
- **Routes**: Handle HTTP requests and validation
- **Services**: Business logic and external integrations
- **Models**: Database schema and relationships
- **Middleware**: Cross-cutting concerns (auth, validation, logging)
- **Utils**: Helper functions and utilities

### Error Handling
- Use async/await with proper error handling
- Custom error classes for different error types
- Consistent error response format
- Logging for debugging and monitoring

### Security
- JWT token validation on protected routes
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration for frontend integration

### Performance
- Database query optimization
- Redis caching for frequently accessed data
- File upload size limits
- Pagination for list endpoints

## Deployment

### Docker
```bash
docker build -t autoprint-backend .
docker run -p 3000:3000 autoprint-backend
```

### Production Considerations
- Set `NODE_ENV=production`
- Use proper database credentials
- Configure SSL/TLS termination
- Set up monitoring and logging
- Configure backup strategies

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use meaningful commit messages
5. Leverage GitHub Copilot for faster development

## Environment Variables

See `../.env.example` for all required environment variables.

## License

MIT License