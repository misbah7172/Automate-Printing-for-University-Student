# AutoPrint Student Web Portal

A comprehensive mobile-first web application for students to upload, pay for, and manage their print jobs through an automated printing system.

## 🌟 Features

### Core Functionality
- **Document Upload**: Support for PDF, Word, PowerPoint, images, and text files
- **Print Configuration**: Copies, color mode, paper size, and duplex printing options  
- **Cost Calculator**: Real-time cost estimation with transparent pricing
- **bKash Integration**: QR code payment system with transaction verification
- **Real-time Queue**: Live position tracking and status updates via WebSocket
- **Confirmation System**: Prominent pickup confirmation with timeout handling
- **Print History**: Complete job history with reprint functionality
- **User Profile**: Account management and preferences

### User Experience
- **Mobile-First Design**: Optimized for mobile devices with responsive layout
- **Accessible Interface**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Real-time Notifications**: Toast messages and badge indicators for updates
- **Offline Support**: Graceful error handling and retry mechanisms
- **Progressive Enhancement**: Works on all modern browsers

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern component-based UI library
- **Material-UI v5** - Comprehensive design system and components
- **Vite** - Fast development build tool with hot reload
- **React Router** - Client-side routing with protected routes
- **Socket.IO Client** - Real-time WebSocket communication
- **React Hook Form** - Performant form handling with validation
- **React Hot Toast** - Beautiful notification system

### State Management
- **React Context API** - Authentication and WebSocket state management
- **Local Storage** - Token persistence and user preferences
- **Real-time Updates** - Live queue position and payment status

### API Integration
- RESTful API services for all backend operations
- JWT-based authentication with automatic token refresh  
- File upload with progress tracking
- Payment gateway integration with bKash
- WebSocket events for real-time features

## 📱 User Interface

### Page Structure
```
├── Authentication
│   ├── Login (Email/Password + Google OAuth placeholder)
│   └── Register (Email verification + Terms acceptance)
├── Main Application (Protected Routes)
│   ├── Upload & Print (File selection + Print options)
│   ├── Payment Submit (QR code + Transaction ID)
│   ├── Queue Status (Real-time position tracking)
│   ├── Print History (Past jobs + Reprint functionality)
│   └── Profile (Account management + Preferences)
```

### Mobile-First Design
- **Responsive Navigation**: Drawer-based menu that adapts to screen size
- **Touch-Optimized**: Large touch targets and gesture support
- **Contextual Actions**: Swipe actions and floating action buttons
- **Progressive Disclosure**: Collapsible sections and step-by-step workflows

## 🔐 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (Student role)
- Automatic token refresh and logout on expiry
- Secure token storage in localStorage

### Data Protection
- Input validation and sanitization
- File type and size restrictions
- CSRF protection through token validation
- Secure API communication over HTTPS

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API server running
- Modern web browser

### Installation

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd AutomatePrinting/student-web
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Create .env file
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3002`

### Production Build
```bash
npm run build
npm run preview  # Preview production build
```

## 🧪 Testing

### Test Suite
- **Unit Tests**: Component behavior and API integration
- **Integration Tests**: Full user workflows and error handling  
- **Accessibility Tests**: WCAG compliance and keyboard navigation
- **Visual Tests**: Responsive design and mobile experience

### Running Tests
```bash
npm test              # Run all tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Test Coverage
- Upload flow with file validation and error handling
- Payment submission and verification workflow
- Confirmation system with timeout scenarios
- Real-time updates and WebSocket communication
- Accessibility and keyboard navigation

## 📋 API Integration

### Print Job Endpoints
```javascript
// Create new print job
POST /api/student/print-jobs
FormData: files + printOptions

// Get user's jobs
GET /api/student/print-jobs/my-jobs

// Get queue status
GET /api/student/print-jobs/queue-status

// Confirm pickup
POST /api/student/print-jobs/:id/confirm-pickup
```

### Payment Endpoints
```javascript
// Generate QR code
POST /api/student/payments/generate-qr
Body: { jobId, amount }

// Verify payment
POST /api/student/payments/verify  
Body: { jobId, transactionId }
```

### WebSocket Events
```javascript
// Real-time queue updates
socket.on('queueStatus', (data) => { ... })
socket.on('myJobStatus', (data) => { ... })
socket.on('paymentVerified', (data) => { ... })
socket.on('confirmationTimeout', (data) => { ... })
```

## 📊 Performance Optimizations

### Code Splitting
- Route-based lazy loading
- Component-level code splitting
- Dynamic imports for large dependencies

### Bundle Optimization
- Tree shaking for unused code elimination
- Asset optimization and compression
- Service worker for caching (future enhancement)

### Network Efficiency
- API request deduplication
- Optimistic updates for better UX
- File upload with progress tracking
- WebSocket connection management

## 🎨 Design System

### Material-UI Theme
```javascript
const theme = {
  palette: {
    primary: '#1976d2',    // AutoPrint blue
    secondary: '#dc004e',  // Accent red
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif'
  },
  components: {
    // Custom component overrides
  }
}
```

### Responsive Breakpoints
- **xs**: 0px+ (Mobile portrait)
- **sm**: 600px+ (Mobile landscape)  
- **md**: 960px+ (Tablet)
- **lg**: 1280px+ (Desktop)
- **xl**: 1920px+ (Large desktop)

## 🔧 Development Guidelines

### Code Organization
```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Navigation and layout
│   └── ProtectedRoute/ # Route guards
├── contexts/           # React Context providers
│   ├── AuthContext    # Authentication state
│   └── SocketContext  # WebSocket management
├── pages/             # Route components
│   ├── Login/         # Authentication pages
│   ├── Upload/        # File upload and options
│   ├── PaymentSubmit/ # Payment workflow
│   ├── Queue/         # Real-time queue status
│   ├── History/       # Print job history
│   └── Profile/       # User account management
├── services/          # API and external services
├── tests/             # Test files
└── App.jsx           # Root component
```

### Component Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow Material-UI component patterns
- Ensure responsive design principles
- Add proper accessibility attributes

### State Management
- Use Context for global state (auth, socket)
- Local state for component-specific data
- Custom hooks for reusable logic
- Optimize re-renders with useMemo/useCallback

## 📈 Future Enhancements

### Planned Features
- **Google OAuth Integration**: Complete social login implementation
- **Push Notifications**: Browser notifications for job updates
- **Offline Support**: Service worker for offline functionality  
- **File Preview**: In-browser document preview before printing
- **Batch Operations**: Multiple file upload and management
- **Print Templates**: Saved print configurations
- **Usage Analytics**: Personal printing statistics

### Technical Improvements
- **Progressive Web App**: PWA capabilities with app manifest
- **Advanced Caching**: Service worker with cache strategies
- **Performance Monitoring**: Real user metrics and error tracking
- **A/B Testing**: Feature flag system for gradual rollouts
- **Internationalization**: Multi-language support

## 🤝 Contributing

### Development Setup
1. Follow the installation steps above
2. Create a feature branch from `main`
3. Make changes following the coding guidelines
4. Add tests for new functionality
5. Ensure all tests pass and code is formatted
6. Submit a pull request with detailed description

### Code Standards
- Use ESLint and Prettier for code formatting
- Follow React and Material-UI best practices
- Write comprehensive tests for new features
- Document API changes and new components
- Ensure accessibility compliance

## 📄 License

This project is part of the AutoPrint automated printing system. All rights reserved.

## 🆘 Support

For technical support or feature requests:
- Create an issue in the repository
- Contact the development team
- Check the API documentation for backend integration

---

**AutoPrint Student Portal** - Making printing accessible, efficient, and user-friendly for students everywhere.