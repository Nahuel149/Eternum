// routes/api.js - Main API Routes
const express = require('express');
const router = express.Router();

// Import controllers
const UserController = require('../controllers/userController');
const AvatarController = require('../controllers/avatarController');
const NotificationController = require('../controllers/notificationController');
const VoiceController = require('../controllers/voiceController');

// Import middleware
const authMiddleware = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');

// Public routes (no authentication required)
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// User Authentication Routes
router.post('/register', upload.fields([
    { name: 'frontPhoto', maxCount: 1 },
    { name: 'leftPhoto', maxCount: 1 },
    { name: 'rightPhoto', maxCount: 1 },
    { name: 'voiceRecording', maxCount: 1 }
]), UserController.register);

router.post('/login', UserController.login);
router.post('/logout', authMiddleware, UserController.logout);
router.post('/refresh-token', UserController.refreshToken);
router.post('/forgot-password', UserController.forgotPassword);
router.post('/reset-password', UserController.resetPassword);

// User Profile Routes (Protected)
router.get('/user/:userId', authMiddleware, UserController.getProfile);
router.put('/user/:userId', authMiddleware, UserController.updateProfile);
router.delete('/user/:userId', authMiddleware, UserController.deleteAccount);
router.get('/user/:userId/stats', authMiddleware, UserController.getUserStats);

// Avatar Routes (Protected)
router.get('/user/:userId/avatar', authMiddleware, AvatarController.getAvatar);
router.put('/user/:userId/avatar', authMiddleware, AvatarController.updateAvatar);
router.post('/user/:userId/avatar/outfit', authMiddleware, AvatarController.saveOutfit);
router.get('/user/:userId/avatar/outfits', authMiddleware, AvatarController.getOutfits);
router.delete('/user/:userId/avatar/outfit/:outfitId', authMiddleware, AvatarController.deleteOutfit);
router.post('/user/:userId/avatar/upload', authMiddleware, upload.single('avatarFile'), AvatarController.uploadAvatarFile);

// Voice Profile Routes (Protected)
router.get('/user/:userId/voice', authMiddleware, VoiceController.getVoiceProfile);
router.put('/user/:userId/voice', authMiddleware, VoiceController.updateVoiceProfile);
router.post('/user/:userId/voice/upload', authMiddleware, upload.single('voiceRecording'), VoiceController.uploadVoiceRecording);
router.post('/user/:userId/voice/generate', authMiddleware, VoiceController.generateVoice);
router.get('/user/:userId/voice/status', authMiddleware, VoiceController.getProcessingStatus);

// Notification Routes (Protected)
router.get('/user/:userId/notifications', authMiddleware, NotificationController.getNotifications);
router.put('/notifications/:notificationId/read', authMiddleware, NotificationController.markAsRead);
router.put('/user/:userId/notifications/read-all', authMiddleware, NotificationController.markAllAsRead);
router.delete('/notifications/:notificationId', authMiddleware, NotificationController.deleteNotification);
router.get('/user/:userId/notifications/unread-count', authMiddleware, NotificationController.getUnreadCount);

// Friends and Social Routes (Protected)
router.get('/user/:userId/friends', authMiddleware, UserController.getFriends);
router.post('/user/:userId/friends/request', authMiddleware, UserController.sendFriendRequest);
router.put('/user/:userId/friends/accept/:requestId', authMiddleware, UserController.acceptFriendRequest);
router.delete('/user/:userId/friends/:friendId', authMiddleware, UserController.removeFriend);
router.get('/user/:userId/friends/requests', authMiddleware, UserController.getFriendRequests);

// Privacy and Permissions Routes (Protected)
router.get('/user/:userId/permissions', authMiddleware, UserController.getPermissions);
router.put('/user/:userId/permissions', authMiddleware, UserController.updatePermissions);
router.post('/user/:userId/block/:targetUserId', authMiddleware, UserController.blockUser);
router.delete('/user/:userId/block/:targetUserId', authMiddleware, UserController.unblockUser);
router.get('/user/:userId/blocked', authMiddleware, UserController.getBlockedUsers);

// Search and Discovery Routes (Protected)
router.get('/search/users', authMiddleware, UserController.searchUsers);
router.get('/search/avatars', authMiddleware, AvatarController.searchAvatars);
router.get('/discover/popular-outfits', authMiddleware, AvatarController.getPopularOutfits);
router.get('/discover/featured-users', authMiddleware, UserController.getFeaturedUsers);

// Content and Media Routes (Protected)
router.post('/upload/avatar-photo', authMiddleware, upload.single('photo'), UserController.uploadAvatarPhoto);
router.post('/upload/voice-sample', authMiddleware, upload.single('voice'), VoiceController.uploadVoiceSample);
router.get('/media/:mediaId', authMiddleware, UserController.getMedia);
router.delete('/media/:mediaId', authMiddleware, UserController.deleteMedia);

// Analytics and Tracking Routes (Protected)
router.post('/analytics/track', authMiddleware, UserController.trackEvent);
router.get('/user/:userId/analytics', authMiddleware, UserController.getAnalytics);

// Admin Routes (Protected + Admin Role)
router.get('/admin/users', authMiddleware, UserController.adminGetUsers);
router.put('/admin/user/:userId/status', authMiddleware, UserController.adminUpdateUserStatus);
router.get('/admin/stats', authMiddleware, UserController.adminGetStats);
router.post('/admin/notification/broadcast', authMiddleware, NotificationController.broadcastNotification);

// AI and Voice Processing Routes (Protected)
router.post('/ai/voice/clone', authMiddleware, VoiceController.cloneVoice);
router.get('/ai/voice/models', authMiddleware, VoiceController.getVoiceModels);
router.post('/ai/avatar/generate', authMiddleware, AvatarController.generateAvatar);
router.get('/ai/recommendations/outfits', authMiddleware, AvatarController.getOutfitRecommendations);

// System Routes
router.get('/system/status', (req, res) => {
    res.json({
        status: 'operational',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
    });
});

router.get('/system/version', (req, res) => {
    res.json({
        version: '1.0.0',
        apiVersion: 'v1',
        buildDate: new Date('2025-01-18'),
        features: [
            'user_registration',
            'avatar_customization',
            'voice_cloning',
            'social_features',
            'ai_integration'
        ]
    });
});

// WebSocket Events (for real-time features)
router.get('/websocket/auth', authMiddleware, (req, res) => {
    // Generate temporary token for WebSocket authentication
    const { signWebSocketToken } = require('../utils/jwt');
    const wsToken = signWebSocketToken(req.userId);
    
    res.json({
        success: true,
        wsToken,
        expiresIn: 3600
    });
});

// Error handling for API routes
router.use((err, req, res, next) => {
    console.error('API Route Error:', err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        availableEndpoints: [
            'POST /api/register',
            'POST /api/login',
            'GET /api/user/:userId',
            'PUT /api/user/:userId/avatar',
            'GET /api/user/:userId/notifications',
            'GET /api/health'
        ]
    });
});

module.exports = router;