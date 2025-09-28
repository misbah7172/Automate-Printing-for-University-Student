# AutoPrint Documentation

Comprehensive documentation for the AutoPrint automated printing management system.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Component Documentation](#component-documentation)
4. [Installation Guide](#installation-guide)
5. [API Reference](#api-reference)
6. [Development Guide](#development-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## System Overview

AutoPrint is a comprehensive printing management system designed for educational institutions, libraries, and business environments. It provides a complete solution for document upload, payment processing, print job management, and hardware integration.

### Key Features

- **Multi-Interface Support**: Web portal, admin dashboard, physical kiosk, and mobile-friendly interfaces
- **Flexible Payment Processing**: Support for card payments, balance accounts, and campus payment systems
- **Hardware Integration**: Direct integration with physical printers through Raspberry Pi agents
- **Real-time Monitoring**: Live status updates and queue management
- **Comprehensive Administration**: User management, analytics, and system monitoring tools

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Student Web   │    │ Admin Dashboard │    │   ESP32 Kiosk   │
│     (React)     │    │     (React)     │    │   (Arduino)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
          ┌─────────────────────────────────────────────────┐
          │              Backend API                        │
          │         (Node.js + Express)                     │
          └─────────┬───────────────────────┬───────────────┘
                    │                       │
          ┌─────────▼───────┐    ┌─────────▼───────────────┐
          │   PostgreSQL    │    │      AWS S3             │
          │   Database      │    │   File Storage          │
          └─────────────────┘    └─────────────────────────┘
                    │
          ┌─────────▼───────┐
          │ Raspberry Pi    │
          │     Agent       │
          │   (Python)      │
          └─────────┬───────┘
                    │
          ┌─────────▼───────┐
          │ Physical        │
          │ Printers        │
          └─────────────────┘
```

### Component Responsibilities

- **Backend API**: Core business logic, authentication, data management
- **Student Web Portal**: Document upload, print requests, payment processing
- **Admin Dashboard**: System management, monitoring, user administration
- **Raspberry Pi Agent**: Physical printer management and job processing  
- **ESP32 Kiosk**: On-site printing interface for walk-up users
- **Database**: Data persistence and relationships
- **File Storage**: Document storage and management

## Component Documentation

### Backend API
- **Location**: `/backend`
- **Technology**: Node.js + Express + Sequelize
- **Documentation**: [Backend README](../backend/README.md)
- **Key Features**: REST API, JWT authentication, payment processing, file upload

### Student Web Portal  
- **Location**: `/student-web`
- **Technology**: React + TypeScript + Vite
- **Documentation**: [Student Web README](../student-web/README.md)
- **Key Features**: Document upload, print configuration, payment processing

### Admin Dashboard
- **Location**: `/admin-dashboard` 
- **Technology**: React + TypeScript + Material-UI
- **Documentation**: [Admin Dashboard README](../admin-dashboard/README.md)
- **Key Features**: User management, system monitoring, analytics

### Raspberry Pi Agent
- **Location**: `/raspi-agent`
- **Technology**: Python + FastAPI + CUPS
- **Documentation**: [Raspberry Pi Agent README](../raspi-agent/README.md)  
- **Key Features**: Printer management, job processing, hardware integration

### ESP32 Kiosk
- **Location**: `/esp32-kiosk`
- **Technology**: Arduino/PlatformIO + ESP32
- **Documentation**: [ESP32 Kiosk README](../esp32-kiosk/README.md)
- **Key Features**: Touch interface, card reading, offline capability

## Installation Guide

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- PostgreSQL 13+
- Docker & Docker Compose
- AWS Account (for S3)
- Stripe Account (for payments)

### Quick Start

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd AutoPrint
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Infrastructure**
   ```bash
   cd infra
   docker-compose up -d
   ```

4. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run db:migrate
   npm run dev
   ```

5. **Frontend Setup**
   ```bash
   # Student Portal
   cd student-web
   npm install
   npm run dev
   
   # Admin Dashboard  
   cd admin-dashboard
   npm install
   npm run dev
   ```

### Detailed Installation

See individual component README files for detailed installation instructions.

## API Reference

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "studentId": "ST001"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "password123"
}
```

### Documents

#### Upload Document
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

document: <file>
```

#### List Documents
```http
GET /api/documents?page=1&limit=10&status=ready
Authorization: Bearer <token>
```

### Print Jobs

#### Create Print Job
```http
POST /api/print-jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "doc-uuid",
  "printOptions": {
    "copies": 2,
    "color": false,
    "doubleSided": true,
    "paperSize": "A4"
  }
}
```

#### List Print Jobs
```http
GET /api/print-jobs?page=1&limit=10&status=queued
Authorization: Bearer <token>
```

### Payments

#### Process Payment
```http
POST /api/payments/:id/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethodId": "pm_stripe_id",
  "useBalance": false
}
```

For complete API documentation, see the OpenAPI specification (planned).

## Development Guide

### Using GitHub Copilot

This project is optimized for GitHub Copilot development:

#### Backend Development
```javascript
// Example: Use Copilot to expand API endpoints
router.get('/statistics', asyncHandler(async (req, res) => {
  // Calculate user print statistics for the dashboard
  // Copilot will suggest database queries and response formatting
}));
```

#### Frontend Development  
```tsx
// Example: Generate React components
interface DocumentCardProps {
  document: Document;
  onPrint: (document: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onPrint }) => {
  // Copilot will suggest component implementation with styling
};
```

#### Python Development
```python
# Example: Printer management functions
class PrinterManager:
    def process_print_job(self, job: PrintJob) -> JobResult:
        """Process a print job with comprehensive error handling"""
        # Copilot will suggest implementation
        pass
```

#### Arduino/ESP32 Development
```cpp
// Example: Touch screen interfaces
void drawMainMenu() {
    // Draw kiosk main menu with buttons and status
    // Copilot will suggest TFT drawing commands
}
```

### Development Workflow

1. **Feature Planning**: Break down features into component-specific tasks
2. **Backend First**: Implement API endpoints and data models  
3. **Frontend Integration**: Build UI components consuming the APIs
4. **Hardware Integration**: Connect physical components to the system
5. **Testing**: Comprehensive testing across all components
6. **Documentation**: Update documentation for new features

### Code Standards

- **TypeScript/JavaScript**: Use ESLint + Prettier, follow Airbnb style guide
- **Python**: Follow PEP 8, use Black formatter, type hints required
- **C++/Arduino**: Follow Google C++ style guide
- **Git**: Conventional commits, feature branches, pull requests

## Deployment

### Production Environment

#### Backend Deployment
- Docker containerization
- Kubernetes orchestration (optional)
- Load balancing with Nginx
- SSL/TLS termination
- Database connection pooling

#### Frontend Deployment  
- Static hosting (Netlify, Vercel, S3+CloudFront)
- CDN for global performance
- Gzip compression
- Service worker for offline capability

#### Infrastructure
- PostgreSQL with replication
- Redis for caching and sessions
- AWS S3 for file storage
- Monitoring with Prometheus/Grafana

### Staging Environment

Mirror production setup with:
- Isolated database
- Test payment processing
- Development certificates
- Debug logging enabled

## Troubleshooting

### Common Issues

#### Backend Issues
- **Database Connection**: Check DATABASE_URL and PostgreSQL status
- **File Upload**: Verify S3 credentials and bucket permissions
- **Payment Processing**: Confirm Stripe keys and webhook endpoints

#### Frontend Issues  
- **API Connection**: Check VITE_API_BASE_URL configuration
- **Authentication**: Verify JWT token storage and expiration
- **File Upload**: Check file size limits and allowed types

#### Hardware Issues
- **Printer Connection**: Verify CUPS configuration and printer drivers
- **Network Connectivity**: Check WiFi credentials and network access
- **Hardware Malfunction**: Test individual components (display, card reader)

### Debugging Tools

- **Backend**: Debug logs, database query logs, API monitoring
- **Frontend**: Browser dev tools, React dev tools, network inspector  
- **Hardware**: Serial monitor, multimeter, logic analyzer

### Performance Monitoring

- Application performance monitoring (APM)
- Database query analysis
- File upload/download metrics
- User experience monitoring

## Security Considerations

### Backend Security
- JWT token validation
- SQL injection prevention
- File upload validation
- Rate limiting
- CORS configuration

### Frontend Security
- XSS prevention
- CSRF protection  
- Secure storage of tokens
- Input validation
- Content Security Policy

### Network Security
- HTTPS/TLS encryption
- API authentication
- Network segmentation
- VPN access for management

### Physical Security  
- Device tampering protection
- Secure mounting
- Access logging
- Emergency shutdown procedures

## Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Follow development guidelines
4. **Add Tests**: Ensure comprehensive test coverage
5. **Update Documentation**: Keep docs current
6. **Submit Pull Request**: Detailed description of changes

### Code Review Process

- Automated testing must pass
- Code review by maintainers  
- Documentation updates required
- Security review for sensitive changes

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: This repository's docs/ folder
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and community support
- **Email**: support@autoprint.example.com

## Roadmap

### Version 1.1
- Mobile application (React Native)
- Advanced analytics dashboard
- Multi-tenant support
- Enhanced security features

### Version 1.2  
- Machine learning for usage prediction
- Advanced document processing
- Integration with more payment providers
- Expanded hardware support

### Version 2.0
- Microservices architecture
- GraphQL API
- Real-time collaboration features
- Cloud-native deployment options