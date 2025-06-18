// middleware/auth.js - Authentication Middleware
const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }
    
    try {
        const decoded = verifyToken(token);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = authMiddleware;

// ===================================
// utils/fileUpload.js - S3 Upload Configuration
// ===================================
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const path = require('path');

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// Check if S3 is configured
const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET;

// Local storage configuration
const localStorage = multer.diskStorage({
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

// S3 storage configuration
const s3Storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    metadata: function (req, file, cb) {
        cb(null, { 
            fieldName: file.fieldname,
            uploadedBy: req.userId || 'anonymous'
        });
    },
    key: function (req, file, cb) {
        let folder = 'misc/';
        if (file.fieldname.includes('Photo')) {
            folder = 'photos/';
        } else if (file.fieldname === 'voiceRecording') {
            folder = 'voices/';
        } else if (file.fieldname.includes('avatar')) {
            folder = 'avatars/';
        }
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, folder + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'voiceRecording') {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed for voice recording'));
        }
    } else if (file.fieldname.includes('Photo')) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for photos'));
        }
    } else {
        cb(null, true);
    }
};

// Create multer instance
const upload = multer({
    storage: useS3 ? s3Storage : localStorage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 25 * 1024 * 1024 // 25MB default
    },
    fileFilter: fileFilter
});

module.exports = { upload, useS3 };

// ===================================
// utils/voiceProcessor.js - Voice Processing Utilities
// ===================================
class VoiceProcessor {
    static async analyzeVoice(audioFilePath) {
        // Placeholder for voice analysis
        // In production, integrate with services like:
        // - Google Cloud Speech-to-Text
        // - AWS Transcribe
        // - Deepgram
        // - AssemblyAI
        
        return {
            pitch: Math.random() * 200 + 50, // 50-250 Hz
            tone: ['warm', 'neutral', 'cheerful', 'confident'][Math.floor(Math.random() * 4)],
            accent: 'neutral',
            language: 'en-US',
            quality: Math.random() * 0.3 + 0.7 // 0.7-1.0
        };
    }
    
    static async generateVoiceModelId(userId, characteristics) {
        return `vm_${userId}_${Date.now()}`;
    }
}

module.exports = VoiceProcessor;

// ===================================
// controllers/userController.js - User Controllers
// ===================================
const bcrypt = require('bcrypt');
const { signLoginToken } = require('../utils/jwt');
const User = require('../models/User');
const Avatar = require('../models/Avatar');
const VoiceProfile = require('../models/VoiceProfile');
const Permission = require('../models/Permission');
const Notification = require('../models/Notification');
const VoiceProcessor = require('../utils/voiceProcessor');

class UserController {
    static async register(req, res) {
        try {
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
            if (!email || !username || !fullName || !password || !birthDate || !zodiacSign) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required fields' 
                });
            }

            // Validate age
            if (parseInt(age) < 18) {
                return res.status(400).json({
                    success: false,
                    message: 'You must be at least 18 years old to register'
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
            const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

            // Process file uploads
            const avatarPhotos = {};
            if (req.files) {
                if (req.files.frontPhoto) {
                    avatarPhotos.front = req.files.frontPhoto[0].location || req.files.frontPhoto[0].path;
                }
                if (req.files.leftPhoto) {
                    avatarPhotos.leftSide = req.files.leftPhoto[0].location || req.files.leftPhoto[0].path;
                }
                if (req.files.rightPhoto) {
                    avatarPhotos.rightSide = req.files.rightPhoto[0].location || req.files.rightPhoto[0].path;
                }
            }

            // Parse hobbies if it's a string
            const parsedHobbies = typeof hobbies === 'string' ? JSON.parse(hobbies) : hobbies;

            // Create new user
            const newUser = new User({
                email: email.toLowerCase(),
                username,
                fullName,
                password: hashedPassword,
                birthDate: new Date(birthDate),
                zodiacSign,
                age: parseInt(age),
                hobbies: parsedHobbies || [],
                customInterests,
                avatarPhotos,
                memoryCoinBalance: 100, // Welcome bonus
                level: 1,
                experience: 0
            });

            await newUser.save();

            // Create default avatar entry
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
                const voiceUrl = voiceFile.location || voiceFile.path;
                
                // Analyze voice characteristics
                const voiceCharacteristics = await VoiceProcessor.analyzeVoice(voiceUrl);
                const aiVoiceModelId = await VoiceProcessor.generateVoiceModelId(newUser._id, voiceCharacteristics);
                
                const voiceProfile = new VoiceProfile({
                    userId: newUser._id,
                    recordingUrl: voiceUrl,
                    recordingDuration: 30,
                    recordingText: "Welcome to Eternum, where memories transcend time and space...",
                    voiceCharacteristics,
                    aiVoiceModelId,
                    isProcessed: false // Will be processed asynchronously
                });

                await voiceProfile.save();
                
                // Queue voice processing job (implement with Bull/RabbitMQ in production)
                // await queueVoiceProcessing(voiceProfile._id);
            }

            // Create default permissions
            const permissions = new Permission({
                userId: newUser._id
            });

            await permissions.save();

            // Create welcome notification
            const welcomeNotification = new Notification({
                userId: newUser._id,
                notificationId: `notif_${Date.now()}_welcome`,
                type: 'welcome',
                title: 'Welcome to Eternum!',
                message: 'Your journey in the metaverse begins now. Customize your avatar and explore!',
                priority: 'high',
                actionRequired: false,
                actions: [
                    {
                        type: 'navigate',
                        label: 'Customize Avatar',
                        endpoint: '/avatar/customize'
                    },
                    {
                        type: 'navigate',
                        label: 'Explore Worlds',
                        endpoint: '/worlds'
                    }
                ]
            });

            await welcomeNotification.save();

            // Create achievement for joining
            // await AchievementController.unlock(newUser._id, 'first_steps');

            // Generate JWT token
            const token = signLoginToken(
                { userId: newUser._id, username: newUser.username },
                process.env.JWT_SECRET || 'eternum-secret-key-2025',
                { expiresIn: '30d' }
            );

            // Log analytics event
            // await AnalyticsController.track('user_registered', { userId: newUser._id });

            // Send response
            res.status(201).json({
                success: true,
                message: 'Registration successful! Welcome to Eternum!',
                token,
                user: {
                    id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    fullName: newUser.fullName,
                    level: newUser.level,
                    memoryCoinBalance: newUser.memoryCoinBalance,
                    avatarId: newAvatar._id
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    static async login(req, res) {
        try {
            const { emailOrUsername, password } = req.body;

            if (!emailOrUsername || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email/username and password are required'
                });
            }

            // Find user by email or username
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

            // Check if account is active
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
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

            // Get avatar data
            const avatar = await Avatar.findOne({ userId: user._id });

            // Generate token
            const token = signLoginToken(
                { userId: user._id, username: user.username },
                process.env.JWT_SECRET || 'eternum-secret-key-2025',
                { expiresIn: '30d' }
            );

            // Check for unread notifications
            const unreadNotifications = await Notification.countDocuments({
                userId: user._id,
                read: false
            });

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
                    roles: user.roles,
                    avatarId: avatar?._id,
                    unreadNotifications
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = UserController;