# Eternum Backend API

Backend server for the Eternum Metaverse Platform - a comprehensive social platform with avatar creation, voice profiles, and immersive experiences.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- npm or yarn

### Local Development
```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm start
```

### Production Deployment (Render.com)
1. Push this backend folder to your GitHub repository
2. Connect repository to Render.com
3. Use the included `render.yaml` configuration
4. Set environment variables in Render dashboard

## 📡 API Endpoints

### Health & Status
- `GET /api/health` - Server health check

### Authentication
- `POST /api/register` - User registration with file uploads
- `POST /api/login` - User authentication

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Avatars
- `GET /api/avatars` - Get all avatars
- `POST /api/avatars` - Create avatar
- `PUT /api/avatars/:id` - Update avatar

### Voice Profiles
- `GET /api/voice-profiles` - Get voice profiles
- `POST /api/voice-profiles` - Create voice profile
- `PUT /api/voice-profiles/:id` - Update voice profile

### Notifications
- `GET /api/notifications/:userId` - Get user notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read

## 🗄️ Database Schema

### Collections
- **users** - User accounts and profiles
- **avatars** - Avatar configurations and assets
- **voiceprofiles** - Voice recordings and AI models
- **permissions** - User permissions and settings
- **notifications** - System and user notifications

## 📁 File Upload Structure
```
uploads/
├── voices/     # Voice recordings (.webm, .wav, .mp3)
├── photos/     # Profile photos (.jpg, .png)
└── avatars/    # Avatar assets
```

## 🔧 Environment Variables

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend.com
```

## 🛡️ Security Features
- JWT authentication
- CORS protection
- Rate limiting
- File upload validation
- Input sanitization
- Helmet security headers

## 📊 Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate limiting

## 🔗 Related Services
- **Frontend**: Unity WebGL build
- **Database**: MongoDB Atlas
- **AI Services**: ElevenLabs, Murf, Speechify
- **Avatar**: Avaturn integration

---
Built for the Eternum Metaverse Platform 🌌
# Eternum