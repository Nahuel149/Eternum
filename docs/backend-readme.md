# Eternum Backend Server

Backend API server for the Eternum Metaverse Platform built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB 6.0+ (local or Atlas)
- (Optional) AWS S3 account for file storage
- (Optional) Redis for caching

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/eternum-backend.git
cd eternum-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your settings:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/eternum
JWT_SECRET=your-secret-key-here
```

5. Create upload directories:
```bash
mkdir -p uploads/avatars uploads/voices uploads/photos
```

6. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

### Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### **POST /api/register**
Register a new user with multipart form data.

**Form Fields:**
- `email` (string, required): User's email address
- `username` (string, required): Unique username
- `fullName` (string, required): User's full name
- `password` (string, required): Password (min 8 characters)
- `birthDate` (string, required): Birth date (YYYY-MM-DD)
- `zodiacSign` (string, required): Zodiac sign
- `age` (number, required): User's age (must be 18+)
- `hobbies` (JSON string array): Selected hobbies
- `customInterests` (string): Additional interests

**File Fields:**
- `frontPhoto` (image): Front face photo
- `leftPhoto` (image): Left profile photo
- `rightPhoto` (image): Right profile photo
- `voiceRecording` (audio): 30-second voice recording

**Response:**
```json
{
  "success": true,
  "message": "Registration successful!",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "level": 1,
    "memoryCoinBalance": 100
  }
}
```

#### **POST /api/login**
Login with email/username and password.

**Body:**
```json
{
  "emailOrUsername": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "level": 5,
    "memoryCoinBalance": 1500,
    "roles": ["user"],
    "unreadNotifications": 3
  }
}
```

#### **GET /api/user/:userId**
Get user profile with related data.

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user-id",
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "level": 5,
    "memoryCoinBalance": 1500,
    "avatar": { ... },
    "voiceProfile": { ... },
    "permissions": { ... }
  }
}
```

#### **PUT /api/user/:userId/avatar** (Authenticated)
Update user's avatar customization.

**Body:**
```json
{
  "customization": {
    "clothing": {
      "head": "tech_visor",
      "body": "cyberpunk_jacket",
      "feet": "hover_boots"
    },
    "appearance": {
      "skinTone": "medium",
      "hairStyle": "modern_fade",
      "hairColor": "purple",
      "eyeColor": "green"
    }
  }
}
```

#### **GET /api/user/:userId/notifications** (Authenticated)
Get user's notifications.

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "notif-id",
      "type": "friend_request",
      "title": "New Friend Request",
      "message": "Jane Doe wants to be your friend",
      "read": false,
      "createdAt": "2025-01-18T10:00:00Z"
    }
  ]
}
```

#### **PUT /api/notifications/:notificationId/read** (Authenticated)
Mark notification as read.

## 🗂️ Project Structure

```
eternum-backend/
├── server.js              # Main server file
├── package.json          # Dependencies and scripts
├── .env.example         # Environment variables template
├── controllers/         # Route controllers
│   └── userController.js
├── middleware/          # Express middleware
│   └── auth.js
├── models/             # Mongoose models
│   ├── User.js
│   ├── Avatar.js
│   ├── VoiceProfile.js
│   └── ...
├── routes/             # API routes
│   └── api.js
├── utils/              # Utility functions
│   ├── fileUpload.js
│   └── voiceProcessor.js
├── uploads/            # Local file storage
│   ├── avatars/
│   ├── voices/
│   └── photos/
└── logs/              # Application logs
```

## 🔧 Configuration

### MongoDB
- Local: `mongodb://localhost:27017/eternum`
- Atlas: `mongodb+srv://username:password@cluster.mongodb.net/eternum`

### File Storage
The backend supports both local and AWS S3 storage:

**Local Storage (Default):**
- Files are stored in the `uploads/` directory
- Served via `/uploads/*` endpoint

**AWS S3 Storage:**
Configure these environment variables:
```env
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=eternum-assets
```

### Security
- Passwords are hashed with bcrypt (10 rounds default)
- JWT tokens expire after 30 days
- File uploads limited to 25MB
- CORS configured for specific origins

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 🚀 Production Deployment

### Recommendations:
1. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name eternum-backend
   ```

2. Set up Nginx as reverse proxy:
   ```nginx
   location /api {
     proxy_pass http://localhost:3000;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection 'upgrade';
     proxy_set_header Host $host;
     proxy_cache_bypass $http_upgrade;
   }
   ```

3. Enable HTTPS with Let's Encrypt
4. Set up MongoDB replica set for high availability
5. Use Redis for session management
6. Implement rate limiting
7. Set up logging with Winston
8. Monitor with tools like New Relic or DataDog

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- Verify network access for MongoDB Atlas

### File Upload Issues
- Check directory permissions: `chmod 755 uploads/`
- Verify multer configuration
- Check file size limits

### CORS Issues
- Add your frontend URL to CORS configuration
- Check request headers

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@eternum.world or join our Discord server.

# 🎮 Eternum Backend - Complete Setup Summary

## ✅ What We've Built

A fully functional Node.js/Express backend server for your Eternum metaverse platform that includes:

### Core Features:
1. **User Registration System**
   - Multi-step registration matching your frontend
   - File upload support for avatar photos (3 angles)
   - Voice recording upload and processing
   - Age verification (18+)
   - Zodiac sign validation
   - Hobbies and interests storage

2. **Authentication & Security**
   - JWT token-based authentication
   - Bcrypt password hashing
   - Protected routes with middleware
   - CORS configuration
   - File upload validation

3. **File Storage**
   - Local storage support (default)
   - AWS S3 integration ready
   - Organized file structure (photos/voices/avatars)
   - 25MB file size limit

4. **Database Integration**
   - Complete MongoDB schemas matching our database design
   - User profiles with all fields
   - Avatar customization storage
   - Voice profiles with AI processing hooks
   - Permissions system
   - Notifications

5. **API Endpoints**
   - `/api/register` - Complete user registration
   - `/api/login` - User authentication
   - `/api/user/:id` - Get user profile
   - `/api/user/:id/avatar` - Update avatar
   - `/api/user/:id/notifications` - Get notifications
   - `/api/notifications/:id/read` - Mark as read

## 🚀 Quick Setup Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Set MongoDB Connection
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/eternum

# MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eternum
```

### 4. Create Directories
```bash
mkdir -p uploads/avatars uploads/voices uploads/photos
```

### 5. Test Connection
```bash
node scripts/test-connection.js
```

### 6. Seed Sample Data
```bash
node scripts/seed-data.js
```

### 7. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 📁 File Structure
```
backend/
├── server.js                 # Main server file
├── package.json             # Dependencies
├── .env.development          # Environment development
├── .env.production         # Environment production 
├── controllers/
│   └── userController.js   # User logic
├── middleware/
│   └── auth.js            # JWT auth
├── models/                # MongoDB schemas
├── utils/
│   ├── fileUpload.js      # S3/local storage
│   └── voiceProcessor.js  # Voice analysis
├── scripts/
│   ├── test-connection.js # DB test
│   └── seed-data.js      # Sample data
└── uploads/              # File storage
└── docs/              # Readme Docs
```

## 🔐 Default Test Accounts

After running seed script:
- `demo@eternum.world` / `demo123456` (Premium user)
- `alice@eternum.world` / `alice123456` 
- `bob@eternum.world` / `bob123456`
- `test@eternum.world` / `testpassword123`

## 🎯 Frontend Integration

Update your frontend's API_URL:
```javascript
// In your HTML file
const API_URL = 'http://localhost:3000/api';
```

The backend accepts FormData with:
- Text fields: email, username, password, etc.
- JSON fields: hobbies array
- File fields: frontPhoto, leftPhoto, rightPhoto, voiceRecording

## 🌟 Key Features Implemented

### From Registration Flow:
- ✅ Email/username validation
- ✅ Password hashing (bcrypt)
- ✅ Age calculation & verification
- ✅ Zodiac sign storage
- ✅ Multiple photo uploads
- ✅ Voice recording upload
- ✅ Hobbies array parsing
- ✅ Custom interests text

### From Database Schema:
- ✅ User creation with all fields
- ✅ Avatar profile initialization
- ✅ Voice profile creation
- ✅ Default permissions
- ✅ Welcome notification
- ✅ MemoryCoin balance (100 welcome bonus)
- ✅ Level system
- ✅ Roles array

### Security & Performance:
- ✅ JWT authentication (30-day expiry)
- ✅ Password strength validation
- ✅ File type validation
- ✅ File size limits
- ✅ Error handling
- ✅ Async/await pattern

## 🔧 Production Considerations

1. **File Storage**: Switch to AWS S3 for production
2. **Database**: Use MongoDB Atlas or replica set
3. **Process Manager**: Use PM2 for stability
4. **Reverse Proxy**: Nginx for SSL/load balancing
5. **Monitoring**: Add logging with Winston
6. **Rate Limiting**: Implement with express-rate-limit
7. **Caching**: Add Redis for sessions
8. **Voice Processing**: Integrate Deepgram/AssemblyAI

## 🎉 Next Steps

1. **Test the API** using the provided test scripts
2. **Connect your frontend** to the backend
3. **Customize** the voice processing logic
4. **Add** more API endpoints as needed
5. **Deploy** to your preferred hosting service

Your Eternum backend is now ready to power your metaverse platform! 🚀