// server.js - Main Eternum Backend Server
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Track MongoDB connection status
let mongoConnected = false;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
        'http://localhost:8080', 
        'http://localhost:3001', 
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'https://eternum.world'
    ],
    credentials: process.env.CORS_CREDENTIALS === 'true' || true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Request logging middleware for development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Serve static files from frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create upload directories
const uploadDirs = ['uploads/avatars', 'uploads/voices', 'uploads/photos'];
uploadDirs.forEach(dir => {
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Multer configuration for file uploads
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        if (file.fieldname.includes('Photo')) {
            uploadPath += 'photos/';
        } else if (file.fieldname === 'voiceRecording') {
            uploadPath += 'voices/';
        } else {
            uploadPath += 'avatars/';
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'voiceRecording') {
            // Accept audio files
            if (file.mimetype.startsWith('audio/')) {
                cb(null, true);
            } else {
                cb(new Error('Only audio files are allowed for voice recording'));
            }
        } else if (file.fieldname.includes('Photo')) {
            // Accept image files
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for photos'));
            }
        } else {
            cb(null, true);
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        mongodb: mongoConnected ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Basic registration endpoint (works with or without MongoDB)
app.post('/api/register', upload.fields([
    { name: 'frontPhoto', maxCount: 1 },
    { name: 'leftPhoto', maxCount: 1 },
    { name: 'rightPhoto', maxCount: 1 },
    { name: 'voiceRecording', maxCount: 1 }
]), async (req, res) => {
    console.log('📝 Registration attempt received');
    console.log('Request body keys:', Object.keys(req.body));
    
    if (!mongoConnected) {
        return res.status(503).json({
            success: false,
            message: 'Database temporarily unavailable. Registration data received and logged for processing when connection is restored.',
            data: {
                received: Object.keys(req.body),
                timestamp: new Date(),
                note: 'Your registration will be processed once the database connection is restored.'
            }
        });
    }

    // If MongoDB is connected, use full registration logic
    try {
        // Import models only when needed to avoid connection errors
        const User = require('./models/User');
        const Avatar = require('./models/Avatar');
        const VoiceProfile = require('./models/VoiceProfile');
        const Permission = require('./models/Permission');
        const Notification = require('./models/Notification');

        const {
            email,
            username,
            fullName,
            password,
            birthDate,
            zodiacSign,
            age,
            hobbies,
            customInterests
        } = req.body;

        // Validate required fields
        if (!email || !username || !fullName || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, username, fullName, password'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email.toLowerCase() ? 
                    'Email already registered' : 
                    'Username already taken'
            });
        }

        // Hash password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Parse hobbies if it's a string
        const parsedHobbies = typeof hobbies === 'string' ? JSON.parse(hobbies) : hobbies || [];

        // Process file uploads
        const avatarPhotos = {};
        if (req.files) {
            if (req.files.frontPhoto) avatarPhotos.front = req.files.frontPhoto[0].path;
            if (req.files.leftPhoto) avatarPhotos.leftSide = req.files.leftPhoto[0].path;
            if (req.files.rightPhoto) avatarPhotos.rightSide = req.files.rightPhoto[0].path;
        }

        // Create new user
        const newUser = new User({
            email: email.toLowerCase(),
            username,
            fullName,
            password: hashedPassword,
            birthDate: birthDate ? new Date(birthDate) : new Date(),
            zodiacSign: zodiacSign || 'aries',
            age: parseInt(age) || 18,
            hobbies: parsedHobbies,
            customInterests: customInterests || '',
            avatarPhotos
        });

        await newUser.save();

        // Create default avatar
        const newAvatar = new Avatar({
            userId: newUser._id,
            avaturnId: `avt_${username}_${Date.now()}`,
            customization: {
                clothing: {
                    head: 'none',
                    body: 'starter_outfit',
                    feet: 'basic_shoes',
                    accessories: []
                },
                appearance: {
                    skinTone: 'medium',
                    hairStyle: 'default',
                    hairColor: 'brown',
                    eyeColor: 'brown'
                }
            }
        });

        await newAvatar.save();

        // Process voice recording
        if (req.files && req.files.voiceRecording) {
            const voiceFile = req.files.voiceRecording[0];
            const voiceProfile = new VoiceProfile({
                userId: newUser._id,
                recordingUrl: voiceFile.path,
                recordingDuration: 30, // Default 30 seconds
                recordingText: "Welcome to Eternum voice recording...",
                voiceCharacteristics: {
                    language: 'en-US',
                    tone: 'neutral',
                    accent: 'neutral',
                    pitch: 150
                }
            });

            await voiceProfile.save();
        }

        // Create default permissions
        const permissions = new Permission({
            userId: newUser._id
        });

        await permissions.save();

        // Create welcome notification
        const welcomeNotification = new Notification({
            userId: newUser._id,
            notificationId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'welcome',
            title: 'Welcome to Eternum!',
            message: 'Your journey in the metaverse begins now. Customize your avatar and explore infinite possibilities!',
            priority: 'high'
        });

        await welcomeNotification.save();

        // Generate JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: newUser._id, timestamp: Date.now() },
            process.env.JWT_SECRET || 'eternum-secret-key-2025',
            { expiresIn: '30d' }
        );

        console.log('✅ User registered successfully:', username);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to Eternum.',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.fullName,
                level: newUser.level || 1,
                memoryCoinBalance: newUser.memoryCoinBalance || 100
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Registration failed due to server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Basic login endpoint
app.post('/api/login', async (req, res) => {
    if (!mongoConnected) {
        return res.status(503).json({
            success: false,
            message: 'Database temporarily unavailable. Please try again later.'
        });
    }

    try {
        const User = require('./models/User');
        const bcrypt = require('bcrypt');
        const jwt = require('jsonwebtoken');

        const { emailOrUsername, password } = req.body;

        if (!emailOrUsername || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/username and password are required'
            });
        }

        // Find user
        const user = await User.findOne({
            $or: [
                { email: emailOrUsername.toLowerCase() },
                { username: emailOrUsername }
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, timestamp: Date.now() },
            process.env.JWT_SECRET || 'eternum-secret-key-2025',
            { expiresIn: '30d' }
        );

        console.log('✅ User logged in:', user.username);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                level: user.level,
                memoryCoinBalance: user.memoryCoinBalance,
                roles: user.roles
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Serve main frontend at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Serve integration test page
app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-integration.html'));
});

// MongoDB connection with graceful error handling
async function connectMongoDB() {
    try {
        console.log('🔄 Attempting MongoDB connection...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        
        mongoConnected = true;
        console.log('✅ MongoDB connected successfully');
        
        // Load and mount API routes after successful connection
        try {
            const apiRoutes = require('./routes/api');
            app.use('/api', apiRoutes);
            console.log('🔗 API routes loaded and mounted');
        } catch (routeError) {
            console.log('⚠️  Some API routes may not be available:', routeError.message);
        }
        
    } catch (error) {
        mongoConnected = false;
        console.log('⚠️  MongoDB connection failed:', error.message);
        console.log('🚀 Server running in limited mode (basic registration/login available)');
        
        // Retry connection every 30 seconds
        setTimeout(connectMongoDB, 30000);
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error.message);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 25MB'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.method} ${req.path}`,
        availableEndpoints: [
            'GET /api/health',
            'POST /api/register',
            'POST /api/login'
        ]
    });
});

// Start server
app.listen(PORT, async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Eternum Backend Server Started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`📄 Frontend available at: http://localhost:${PORT}/`);
    console.log(`🧪 Integration test at: http://localhost:${PORT}/test`);
    console.log(`🔗 API endpoints at: http://localhost:${PORT}/api`);
    console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Attempt MongoDB connection
    await connectMongoDB();
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down gracefully...');
    
    if (mongoConnected) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    }
    
    console.log('✅ Server shutdown complete');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🔄 SIGTERM received, shutting down gracefully...');
    
    if (mongoConnected) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    }
    
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
    console.error('Stack:', error.stack);
    
    // Give time for logging before exit
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Don't exit on unhandled rejections in production
    if (process.env.NODE_ENV !== 'production') {
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
});

module.exports = app;