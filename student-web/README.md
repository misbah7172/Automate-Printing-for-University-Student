# AutoPrint Student Web Portal

React-based student interface for the AutoPrint system. Provides an intuitive portal for students to upload documents, manage print jobs, handle payments, and track printing history.

## Features

- **Document Upload**: Drag-and-drop interface for uploading documents
- **Print Job Management**: Configure print options and track job status
- **Payment Processing**: Secure payment handling with multiple payment methods
- **Balance Management**: Track account balance and add funds
- **Order History**: View past print jobs and download receipts
- **Real-time Status**: Live updates on print job progress
- **File Preview**: Preview documents before printing
- **Cost Calculator**: Estimate printing costs before submitting jobs

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **UI Library**: Tailwind CSS + Headless UI or Chakra UI
- **State Management**: React Query + Zustand
- **Routing**: React Router v6
- **File Upload**: React Dropzone
- **Payment**: Stripe Elements
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
student-web/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Common components (Button, Card, etc.)
│   │   ├── upload/         # File upload components
│   │   ├── payment/        # Payment-related components
│   │   └── print/          # Print job components
│   ├── pages/              # Page components
│   │   ├── Home/           # Landing page
│   │   ├── Upload/         # Document upload
│   │   ├── PrintJobs/      # Job management
│   │   ├── Payment/        # Payment processing
│   │   ├── History/        # Order history
│   │   └── Profile/        # User profile
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service functions
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── stores/             # Zustand stores
│   └── styles/             # Global styles
├── public/                 # Static assets
└── tests/                  # Test files
```

## Key Features

### Document Upload & Management
- Drag-and-drop file upload interface
- File type validation and size limits
- Preview functionality for supported formats
- Document processing status tracking

### Print Configuration
- Paper size selection (A4, Letter, etc.)
- Color/grayscale options
- Single/double-sided printing
- Number of copies
- Page range selection

### Payment System
- Multiple payment methods (card, balance, campus card)
- Secure Stripe integration
- Balance top-up functionality
- Cost estimation and breakdown

### Job Tracking
- Real-time print job status updates
- Queue position tracking
- Completion notifications
- Error handling and retry options

## Using GitHub Copilot for Development

This student portal is optimized for GitHub Copilot assistance:

### 1. File Upload Components
```tsx
// Example: Generate a comprehensive file upload component
interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes: string[];
  maxFiles: number;
  maxSize: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, acceptedTypes, maxFiles, maxSize }) => {
  // Copilot will suggest drag-and-drop implementation with validation
};
```

### 2. Print Options Configuration
```tsx
// Example: Create print options form
interface PrintOptionsProps {
  document: Document;
  onOptionsChange: (options: PrintOptions) => void;
}

const PrintOptionsForm: React.FC<PrintOptionsProps> = ({ document, onOptionsChange }) => {
  // Copilot will suggest form fields for print configuration
};
```

### 3. Payment Integration
```tsx
// Example: Implement Stripe payment component
interface PaymentFormProps {
  amount: number;
  onPaymentSuccess: (paymentIntent: PaymentIntent) => void;
  onPaymentError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onPaymentSuccess, onPaymentError }) => {
  // Copilot will suggest Stripe Elements integration
};
```

### 4. Real-time Updates
```tsx
// Example: Create real-time job status component
const PrintJobStatus: React.FC<{ jobId: string }> = ({ jobId }) => {
  // Copilot will suggest WebSocket or polling implementation
};
```

### 5. Responsive Design
```tsx
// Example: Generate responsive layout components
const ResponsiveGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Copilot will suggest responsive grid implementation
};
```

## Development Guidelines

### User Experience
- Mobile-first responsive design
- Intuitive navigation and user flows
- Clear feedback for all user actions
- Accessible design following WCAG guidelines
- Fast loading times and smooth interactions

### Code Quality
- TypeScript for type safety
- Component reusability and composition
- Proper error handling and loading states
- Comprehensive testing coverage
- Clean, readable code structure

### Performance
- Lazy loading for large components
- Image optimization and caching
- Efficient state management
- Minimal bundle size
- Progressive Web App capabilities

### Security
- Input validation and sanitization
- Secure payment processing
- XSS protection
- CSRF prevention
- Secure file uploads

## Environment Configuration

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

# Payment Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# File Upload Configuration
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,png

# Feature Flags
VITE_ENABLE_FILE_PREVIEW=true
VITE_ENABLE_REAL_TIME_TRACKING=true
```

## Key Components to Build with Copilot

### 1. Document Upload Flow
```tsx
// Multi-step upload process with progress tracking
const DocumentUploadWizard: React.FC = () => {
  // Steps: File selection → Preview → Print options → Payment → Confirmation
};
```

### 2. Interactive Cost Calculator
```tsx
// Real-time cost calculation based on print options
const CostCalculator: React.FC = () => {
  // Dynamic pricing based on pages, color, copies, etc.
};
```

### 3. Print Queue Dashboard
```tsx
// Visual representation of print queue and job status
const PrintQueueDashboard: React.FC = () => {
  // Real-time updates with queue position and estimated time
};
```

### 4. Payment History
```tsx
// Comprehensive payment and order history
const PaymentHistory: React.FC = () => {
  // Filtering, searching, and receipt generation
};
```

### 5. File Preview System
```tsx
// Preview documents before printing
const DocumentPreview: React.FC = () => {
  // Support for PDF, images, and document formats
};
```

## Testing Strategy

### Unit Tests
- Component rendering and behavior
- Hook functionality
- Utility functions
- Form validation

### Integration Tests
- API integration
- Payment flow
- File upload process
- User authentication

### E2E Tests
- Complete user workflows
- Payment processing
- Document upload and printing
- Error scenarios

## Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to CDN or static hosting
# Build output in 'dist/' folder
```

## Progressive Web App

The student portal is designed as a PWA with:
- Offline capability for viewing history
- Push notifications for job updates
- Install prompt for mobile users
- Caching strategies for better performance

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Contributing

1. Follow React and TypeScript best practices
2. Use GitHub Copilot to accelerate development
3. Maintain responsive design principles
4. Write comprehensive tests
5. Follow accessibility guidelines
6. Update documentation

## License

MIT License