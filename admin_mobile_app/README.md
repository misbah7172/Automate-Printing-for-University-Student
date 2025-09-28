# AutoPrint Admin Mobile App

A comprehensive Flutter mobile application for managing the AutoPrint university printing system.

## Features

### 🏠 Dashboard
- **Quick Stats**: Real-time overview of pending payments, queue status, completed jobs, and revenue
- **Live Queue Panel**: Current printing queue with job details
- **Printer Status**: Real-time printer status monitoring
- **Quick Actions**: Fast access to key admin functions

### 👥 User Management
- View all registered students
- Search and filter capabilities
- Block/unblock user accounts
- User activity tracking

### 💳 Payment Management
- **Pending Payments**: Review and verify bKash transaction IDs
- **Payment Verification**: Approve or reject payments with notes
- **Transaction History**: Track payment records
- Real-time payment notifications

### 📋 Queue Management
- **Live Queue View**: See all jobs in printing queue with serial numbers
- **Job Control**: Skip, requeue, cancel, or force print jobs
- **Queue Position**: Visual queue positions and estimated wait times
- **Status Tracking**: Monitor job progression through different states

### 🖨️ Printer Control
- **Real-time Status**: Monitor printer status (idle, printing, error, offline)
- **Print Control**: Pause, resume, or cancel current print jobs
- **Hardware Status**: Ink levels and paper status (when supported)
- **Error Handling**: Manage printer errors and job failures

### 📊 Reports & Analytics (Coming Soon)
- Daily, weekly, and monthly reports
- Revenue tracking and analysis
- Usage statistics and trends
- Export capabilities

## Technical Details

### Architecture
- **Frontend**: Flutter 3.x with Material Design 3
- **State Management**: Provider pattern
- **Backend API**: Node.js with MongoDB
- **Authentication**: JWT tokens for secure admin access
- **Storage**: Flutter Secure Storage for token management

### Authentication
Default admin credentials:
- **Super Admin**: `admin` / `admin123`
- **Staff Admin**: `staff` / `staff123`

### API Integration
- RESTful API communication with backend
- Real-time updates for queue and printer status
- Secure token-based authentication
- Error handling and retry mechanisms

### Supported Platforms
- Android (API 21+)
- iOS (iOS 11+)
- Responsive design for tablets and phones

## Installation & Setup

### Prerequisites
- Flutter SDK 3.x or higher
- Android Studio / VS Code with Flutter extensions
- Running AutoPrint backend server

### Getting Started

1. **Clone and navigate to admin app directory**:
   ```bash
   cd admin_mobile_app
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Configure backend URL** (if needed):
   - Edit `lib/services/admin_api_service.dart`
   - Update `baseUrl` to match your backend server

4. **Run the application**:
   ```bash
   flutter run
   ```

### Build for Production

**Android APK**:
```bash
flutter build apk --release
```

**iOS**:
```bash
flutter build ios --release
```

## Usage Guide

### 🔐 Logging In
1. Open the admin app
2. Enter admin credentials
3. Access the main dashboard

### 💰 Managing Payments
1. Go to **Payments** tab
2. Review pending payment requests
3. Verify bKash transaction IDs
4. Approve or reject with notes

### 📋 Managing Print Queue
1. Navigate to **Queue** tab
2. View current printing queue
3. Use job actions (skip, cancel, requeue, force print)
4. Monitor queue progression

### 🖨️ Controlling Printer
1. Check **Printer** status on dashboard
2. Use printer controls (pause, resume, cancel)
3. Monitor hardware status and errors

### 👥 Managing Users
1. Access **Users** tab
2. Search for specific students
3. Block/unblock accounts as needed
4. View user activity and history

## Development

### Project Structure
```
lib/
├── models/           # Data models (Admin, Student, PrintJob, etc.)
├── providers/        # State management providers
├── screens/          # UI screens organized by feature
├── services/         # API services and external integrations
├── widgets/          # Reusable UI components
└── utils/           # Utility functions and helpers
```

### Key Components
- **AuthProvider**: Manages admin authentication state
- **DashboardProvider**: Handles dashboard data and real-time updates
- **AdminApiService**: API communication layer
- **Custom Widgets**: Reusable UI components for stats, queues, etc.

## Security Features

- **JWT Authentication**: Secure token-based login system
- **Role-based Access**: Different permission levels for admin types
- **Secure Storage**: Encrypted local storage for sensitive data
- **API Security**: Protected endpoints with authentication middleware
- **Session Management**: Automatic logout and token refresh

## Future Enhancements

### Planned Features
- [ ] Push notifications for urgent events
- [ ] Advanced reporting and analytics
- [ ] Multiple printer support
- [ ] Real-time chat with students
- [ ] Document preview capabilities
- [ ] Bulk operations for queue management
- [ ] Advanced user management features
- [ ] System logs and audit trails

### Technical Improvements
- [ ] Offline mode support
- [ ] Real-time WebSocket integration
- [ ] Enhanced error handling
- [ ] Performance optimizations
- [ ] Automated testing suite
- [ ] CI/CD pipeline integration

## Support

For technical support or feature requests:
- Review the backend API documentation
- Check Flutter/Dart documentation for client-side issues
- Monitor application logs for debugging

## Contributing

When contributing to the admin mobile app:
1. Follow Flutter/Dart coding standards
2. Maintain responsive design principles
3. Update documentation for new features
4. Test on multiple device sizes
5. Ensure API compatibility with backend changes

---

**AutoPrint Admin Mobile App** - Complete control over your university printing system, now in your pocket! 📱🖨️
