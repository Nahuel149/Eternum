// controllers/userController.js - User Controller
const bcrypt = require('bcrypt');
const { signLoginToken } = require('../utils/jwt');
const User = require('../models/User');
const Avatar = require('../models/Avatar');
const VoiceProfile = require('../models/VoiceProfile');
const Permission = require('../models/Permission');
const Notification = require('../models/Notification');
const VoiceProcessor = require('../utils/voiceProcessor');

class UserController {
    // User Registration
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

            // Generate JWT token
            const token = signLoginToken(
                { userId: newUser._id, username: newUser.username },
                process.env.JWT_SECRET || 'eternum-secret-key-2025',
                { expiresIn: '30d' }
            );

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

    // User Login
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

    // Get User Profile
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.params.userId)
                .select('-password')
                .lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get related data
            const [avatar, voiceProfile, permissions] = await Promise.all([
                Avatar.findOne({ userId: user._id }),
                VoiceProfile.findOne({ userId: user._id }),
                Permission.findOne({ userId: user._id })
            ]);

            res.json({
                success: true,
                user: {
                    ...user,
                    avatar,
                    voiceProfile,
                    permissions
                }
            });

        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user data',
                error: error.message
            });
        }
    }

    // Update User Profile
    static async updateProfile(req, res) {
        try {
            const allowedUpdates = ['fullName', 'hobbies', 'customInterests', 'settings'];
            const updates = {};
            
            // Filter allowed updates
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = req.body[key];
                }
            });

            const user = await User.findByIdAndUpdate(
                req.params.userId,
                updates,
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    }

    // Logout (mainly for token invalidation tracking)
    static async logout(req, res) {
        try {
            // In a production app, you might want to blacklist the token
            // For now, we'll just return success
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed',
                error: error.message
            });
        }
    }

    // Additional methods would go here...
    static async refreshToken(req, res) {
        // Implementation for token refresh
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async forgotPassword(req, res) {
        // Implementation for password reset
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async resetPassword(req, res) {
        // Implementation for password reset
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async deleteAccount(req, res) {
        // Implementation for account deletion
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async getUserStats(req, res) {
        // Implementation for user statistics
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async getFriends(req, res) {
        // Implementation for getting friends
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async sendFriendRequest(req, res) {
        // Implementation for sending friend requests
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async acceptFriendRequest(req, res) {
        // Implementation for accepting friend requests
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async removeFriend(req, res) {
        // Implementation for removing friends
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async getFriendRequests(req, res) {
        // Implementation for getting friend requests
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async getPermissions(req, res) {
        // Implementation for getting permissions
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async updatePermissions(req, res) {
        // Implementation for updating permissions
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async blockUser(req, res) {
        // Implementation for blocking users
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async unblockUser(req, res) {
        // Implementation for unblocking users
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async getBlockedUsers(req, res) {
        // Implementation for getting blocked users
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async searchUsers(req, res) {
        // Implementation for searching users
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async getFeaturedUsers(req, res) {
        // Implementation for getting featured users
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async uploadAvatarPhoto(req, res) {
        // Implementation for uploading avatar photos
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async getMedia(req, res) {
        // Implementation for getting media
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async deleteMedia(req, res) {
        // Implementation for deleting media
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async trackEvent(req, res) {
        // Implementation for tracking events
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async getAnalytics(req, res) {
        // Implementation for getting analytics
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async adminGetUsers(req, res) {
        // Implementation for admin getting users
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async adminUpdateUserStatus(req, res) {
        // Implementation for admin updating user status
        res.status(501).json({ message: 'Not implemented yet' });
    }

    static async adminGetStats(req, res) {
        // Implementation for admin getting stats
        res.status(501).json({ message: 'Not implemented yet' });
    }
}

module.exports = UserController;