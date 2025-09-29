# Manual Render Deployment (Backup Method)

If the render.yaml automatic deployment doesn't work, use this manual setup:

## Step-by-Step Manual Deployment

### 1. Create New Web Service
- Go to [Render Dashboard](https://dashboard.render.com)
- Click "New +" → "Web Service"

### 2. Connect Repository
- **Repository URL**: `https://github.com/misbah7172/Automate-Printing-for-University-Student`
- **Branch**: `main`

### 3. Configure Service Settings
```
Name: autoprint-backend
Runtime: Node
Region: Choose your preferred region
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

### 4. Environment Variables
Add these in the Environment section:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://misbah244176_db_user:QcAQFTCziOs43vR2@autoprint.karym06.mongodb.net/autoprint
JWT_SECRET=your-secure-random-string-here
PORT=10000
```

### 5. Advanced Settings
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Yes

### 6. Deploy
- Click "Create Web Service"
- Wait for deployment to complete

## Generate Secure JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use the output as your JWT_SECRET value.

## After Deployment
1. Note your service URL: `https://your-service-name.onrender.com`
2. Update mobile app URLs with your actual service name
3. Test the health endpoint: `https://your-service-name.onrender.com/api/health`