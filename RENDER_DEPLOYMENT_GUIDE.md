# Complete Render Deployment Guide

## 📋 Prerequisites
- Your backend is prepared with all configuration files
- MongoDB Atlas connection string ready
- GitHub repository with your backend code
- Render account (free tier available)

## 🚀 Step 1: Deploy Backend to Render

### 1.1 Create Render Account
- Go to [Render.com](https://render.com) and sign up with GitHub
- Connect your GitHub account

### 1.2 Create Web Service
1. Click "New +" → "Web Service"
2. Select your backend repository (AutomatePrinting)
3. Configure the service:
   - **Name**: `automate-printing-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 1.3 Add Environment Variables
In the Render dashboard, add these environment variables:

```
MONGODB_URI=mongodb+srv://misbah244176_db_user:QcAQFTCziOs43vR2@autoprint.karym06.mongodb.net/autoprint
JWT_SECRET=your-jwt-secret-key
PORT=3000
NODE_ENV=production
```

**Important**: Replace `your-jwt-secret-key` with a secure random string.

### 1.4 Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Note your service URL: `https://your-service-name.onrender.com`

## 📱 Step 2: Update Mobile Apps

### 2.1 Update Production URLs
Replace `your-service-name` in both config files with your actual Render service name:

**mobile-app/lib/config/api_config.dart**:
```dart
static const String _productionUrl = 'https://automate-printing-backend.onrender.com';
```

**admin_mobile_app/lib/config/api_config.dart**:
```dart
static const String _productionUrl = 'https://automate-printing-backend.onrender.com';
```

### 2.2 Environment Configuration
Both apps are already configured for production (`_useProduction = true`). 

For development, change to:
```dart
static const bool _useProduction = false;  // Use local development
static const bool _isEmulator = true;     // If using emulator
```

## 🔧 Step 3: Test Backend Deployment

### 3.1 Health Check
Visit: `https://your-service-name.onrender.com/api/health`

Should return: `{"status": "ok", "timestamp": "..."}`

### 3.2 API Test
Test login endpoint: `https://your-service-name.onrender.com/api/admin/login`

## 📦 Step 4: Build Release APKs

### 4.1 Student App
```bash
cd mobile-app
flutter build apk --release
```
APK location: `mobile-app/build/app/outputs/flutter-apk/app-release.apk`

### 4.2 Admin App
```bash
cd admin_mobile_app
flutter build apk --release
```
APK location: `admin_mobile_app/build/app/outputs/flutter-apk/app-release.apk`

## ⚙️ Step 5: Environment Switching

### Production Mode (Default)
```dart
static const bool _useProduction = true;
```
- Uses Render hosted backend
- For real devices and production

### Development Mode
```dart
static const bool _useProduction = false;
static const bool _isEmulator = false;  // Real device
static const bool _isEmulator = true;   // Emulator
```

## 🔍 Step 6: Testing

### 6.1 Backend Testing
1. Check service logs in Render dashboard
2. Test API endpoints with Postman/curl
3. Verify MongoDB Atlas connections

### 6.2 Mobile App Testing
1. Install APK on Android device
2. Test registration/login
3. Test printing functionality
4. Check admin functions

## 🚨 Troubleshooting

### Common Issues
1. **CORS Errors**: Backend is configured with wildcard "*" for all origins
2. **Connection Timeout**: Check if Render service is sleeping (free tier)
3. **Database Connection**: Verify MongoDB Atlas connection string
4. **SSL Issues**: Render provides HTTPS automatically

### Render Free Tier Limitations
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider this for user experience

### Logs and Debugging
- Render Dashboard → Your Service → Logs
- Real-time logs show all server activity
- Use for debugging API issues

## 📝 Production Checklist

### Backend
- [x] MongoDB Atlas connection configured
- [x] CORS enabled for all origins
- [x] Environment variables set in Render
- [x] Health check endpoint working
- [x] JWT authentication configured

### Mobile Apps
- [x] Production URLs configured
- [x] API services using centralized config
- [x] Release APKs built
- [x] Environment switching implemented

### Security
- [ ] Change default JWT secret
- [ ] Review CORS policy if needed
- [ ] Implement rate limiting (optional)
- [ ] Add request logging (optional)

## 🔄 Updates and Maintenance

### Backend Updates
1. Push changes to GitHub
2. Render auto-deploys from connected repository
3. Monitor deployment in Render dashboard

### Mobile App Updates
1. Update code
2. Rebuild APKs: `flutter build apk --release`
3. Distribute new APKs to users

### Environment Management
Use the centralized config to easily switch between:
- Local development
- Emulator testing  
- Production deployment

## 📞 Support
Your backend is now ready for production use with:
- **Backend URL**: `https://your-service-name.onrender.com`
- **Database**: MongoDB Atlas cloud
- **Mobile Apps**: Production-ready APKs
- **CORS**: Configured for universal access

The system is designed to work seamlessly from any network location!