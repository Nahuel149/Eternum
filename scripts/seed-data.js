// scripts/seed-data.js - Seed Sample Data for Development
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Avatar = require('../models/Avatar');
const VoiceProfile = require('../models/VoiceProfile');
const Permission = require('../models/Permission');
const Notification = require('../models/Notification');

// Sample data
const sampleUsers = [
    {
        email: 'demo@eternum.world',
        username: 'demo_explorer',
        fullName: 'Demo Explorer',
        password: 'demo123456',
        birthDate: new Date('1990-05-15'),
        zodiacSign: 'taurus',
        age: 34,
        hobbies: ['gaming', 'art', 'technology', 'music'],
        customInterests: 'Exploring virtual worlds and creating digital art',
        level: 10,
        memoryCoinBalance: 2500,
        isPremium: true,
        roles: ['user', 'premium'],
        settings: {
            language: 'en',
            theme: 'dark',
            notifications: true,
            privacy: 'friends'
        },
        stats: {
            totalPlayTime: 156780, // ~43 hours
            environmentsVisited: ['office', 'cafe', 'apartment', 'club', 'restaurant'],
            friendsCount: 12,
            achievementsUnlocked: 8,
            messagesExchanged: 1247,
            eventsAttended: 5,
            memoriesCreated: 23
        }
    },
    {
        email: 'alice@eternum.world',
        username: 'alice_wonderland',
        fullName: 'Alice Johnson',
        password: 'alice123456',
        birthDate: new Date('1998-08-22'),
        zodiacSign: 'leo',
        age: 26,
        hobbies: ['fashion', 'dancing', 'photography', 'socializing'],
        customInterests: 'Fashion design and virtual photography',
        level: 5,
        memoryCoinBalance: 1200,
        settings: {
            language: 'en',
            theme: 'light',
            notifications: true,
            privacy: 'public'
        },
        stats: {
            totalPlayTime: 89340, // ~25 hours
            environmentsVisited: ['cafe', 'club', 'apartment'],
            friendsCount: 18,
            achievementsUnlocked: 4,
            messagesExchanged: 892,
            eventsAttended: 8,
            memoriesCreated: 15
        }
    },
    {
        email: 'bob@eternum.world',
        username: 'bob_builder',
        fullName: 'Bob Smith',
        password: 'bob123456',
        birthDate: new Date('1985-12-10'),
        zodiacSign: 'sagittarius',
        age: 39,
        hobbies: ['sports', 'cooking', 'nature', 'technology'],
        customInterests: 'Building virtual environments and cooking shows',
        level: 8,
        memoryCoinBalance: 1800,
        settings: {
            language: 'en',
            theme: 'auto',
            notifications: false,
            privacy: 'friends'
        },
        stats: {
            totalPlayTime: 124560, // ~35 hours
            environmentsVisited: ['office', 'restaurant', 'apartment'],
            friendsCount: 7,
            achievementsUnlocked: 6,
            messagesExchanged: 456,
            eventsAttended: 3,
            memoriesCreated: 11
        }
    },
    {
        email: 'maria@eternum.world',
        username: 'maria_creative',
        fullName: 'Maria Rodriguez',
        password: 'maria123456',
        birthDate: new Date('1995-03-18'),
        zodiacSign: 'pisces',
        age: 29,
        hobbies: ['art', 'music', 'literature', 'travel'],
        customInterests: 'Digital art creation and virtual concerts',
        level: 7,
        memoryCoinBalance: 1650,
        isPremium: true,
        roles: ['user', 'premium'],
        settings: {
            language: 'es',
            theme: 'dark',
            notifications: true,
            privacy: 'friends'
        },
        stats: {
            totalPlayTime: 98760, // ~27 hours
            environmentsVisited: ['cafe', 'club', 'office'],
            friendsCount: 15,
            achievementsUnlocked: 5,
            messagesExchanged: 743,
            eventsAttended: 6,
            memoriesCreated: 19
        }
    },
    {
        email: 'admin@eternum.world',
        username: 'admin_eternum',
        fullName: 'System Administrator',
        password: 'admin123456',
        birthDate: new Date('1988-01-01'),
        zodiacSign: 'capricorn',
        age: 36,
        hobbies: ['technology', 'gaming', 'management'],
        customInterests: 'System administration and community management',
        level: 50,
        memoryCoinBalance: 10000,
        isPremium: true,
        roles: ['user', 'admin', 'moderator'],
        settings: {
            language: 'en',
            theme: 'dark',
            notifications: true,
            privacy: 'private'
        },
        stats: {
            totalPlayTime: 500000, // ~139 hours
            environmentsVisited: ['office', 'cafe', 'apartment', 'club', 'restaurant'],
            friendsCount: 50,
            achievementsUnlocked: 25,
            messagesExchanged: 5000,
            eventsAttended: 20,
            memoriesCreated: 100
        }
    }
];

// Sample avatar configurations
const sampleAvatarConfigs = [
    {
        customization: {
            clothing: {
                head: 'tech_visor',
                body: 'cyberpunk_jacket',
                feet: 'hover_boots',
                accessories: ['glasses', 'necklace', 'watch']
            },
            appearance: {
                skinTone: 'medium',
                hairStyle: 'modern_fade',
                hairColor: 'brown',
                eyeColor: 'blue',
                facialHair: 'stubble',
                bodyType: 'athletic'
            }
        },
        savedOutfits: [
            {
                name: 'Cyberpunk Explorer',
                description: 'Futuristic outfit for exploring digital worlds',
                items: {
                    clothing: {
                        head: 'tech_visor',
                        body: 'cyberpunk_jacket',
                        feet: 'hover_boots',
                        accessories: ['glasses', 'necklace']
                    }
                },
                isPublic: true,
                tags: ['cyberpunk', 'futuristic', 'tech'],
                timesUsed: 15
            }
        ]
    },
    {
        customization: {
            clothing: {
                head: 'headband',
                body: 'dress',
                feet: 'heels',
                accessories: ['earrings', 'bracelet', 'ring']
            },
            appearance: {
                skinTone: 'light',
                hairStyle: 'long',
                hairColor: 'blonde',
                eyeColor: 'green',
                bodyType: 'slim'
            },
            makeup: {
                enabled: true,
                style: 'glamorous',
                lipstick: 'red',
                eyeshadow: 'gold',
                blush: 'pink'
            }
        },
        savedOutfits: [
            {
                name: 'Elegant Evening',
                description: 'Perfect for social events and parties',
                items: {
                    clothing: {
                        head: 'headband',
                        body: 'dress',
                        feet: 'heels',
                        accessories: ['earrings', 'bracelet']
                    }
                },
                isPublic: true,
                tags: ['elegant', 'evening', 'party'],
                timesUsed: 22
            },
            {
                name: 'Casual Chic',
                description: 'Stylish yet comfortable everyday look',
                items: {
                    clothing: {
                        head: 'none',
                        body: 'casual_shirt',
                        feet: 'sneakers',
                        accessories: ['ring']
                    }
                },
                isPublic: false,
                tags: ['casual', 'comfortable'],
                timesUsed: 8
            }
        ]
    }
    // Add more avatar configs as needed
];

// Sample voice characteristics
const sampleVoiceCharacteristics = [
    {
        pitch: 125,
        tone: 'confident',
        accent: 'american',
        language: 'en-US',
        speed: 'normal',
        volume: 'normal',
        emotionalRange: 0.8,
        clarity: 0.9
    },
    {
        pitch: 180,
        tone: 'cheerful',
        accent: 'british',
        language: 'en-GB',
        speed: 'fast',
        volume: 'normal',
        emotionalRange: 0.9,
        clarity: 0.85
    },
    {
        pitch: 110,
        tone: 'calm',
        accent: 'neutral',
        language: 'en-US',
        speed: 'slow',
        volume: 'quiet',
        emotionalRange: 0.6,
        clarity: 0.95
    }
];

// Sample notifications
const createSampleNotifications = (userId, userIndex) => {
    const baseNotifications = [
        {
            type: 'welcome',
            title: 'Welcome to Eternum!',
            message: 'Your journey in the metaverse begins now. Customize your avatar and explore!',
            priority: 'high',
            category: 'system',
            read: userIndex === 0 ? true : false, // Demo user has read it
            actions: [
                {
                    type: 'navigate',
                    label: 'Customize Avatar',
                    endpoint: '/avatar/customize',
                    style: 'primary'
                }
            ]
        },
        {
            type: 'achievement',
            title: 'First Steps Achievement!',
            message: 'You completed your profile setup. Reward: 100 MemoryCoins!',
            priority: 'high',
            category: 'achievement',
            read: false,
            appearance: {
                icon: 'trophy',
                color: 'yellow'
            }
        }
    ];

    if (userIndex === 0) { // Demo user gets extra notifications
        baseNotifications.push(
            {
                type: 'friend_request',
                title: 'New Friend Request',
                message: 'Alice wants to be your friend',
                priority: 'normal',
                category: 'social',
                read: false,
                actionRequired: true,
                actions: [
                    {
                        type: 'api_call',
                        label: 'Accept',
                        endpoint: '/api/friends/accept',
                        method: 'POST',
                        style: 'success'
                    }
                ]
            },
            {
                type: 'level_up',
                title: 'Level Up!',
                message: 'Congratulations! You reached level 10!',
                priority: 'high',
                category: 'achievement',
                read: true
            }
        );
    }

    return baseNotifications.map(notif => ({
        userId,
        notificationId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notif,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
    }));
};

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');
        
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eternum';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        
        // Clear existing data (optional - comment out to preserve existing data)
        console.log('\n🗑️  Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Avatar.deleteMany({}),
            VoiceProfile.deleteMany({}),
            Permission.deleteMany({}),
            Notification.deleteMany({})
        ]);
        console.log('✅ Existing data cleared');
        
        console.log('\n👥 Creating sample users...');
        
        const createdUsers = [];
        
        for (let i = 0; i < sampleUsers.length; i++) {
            const userData = sampleUsers[i];
            
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;
            
            // Create user
            const newUser = new User(userData);
            await newUser.save();
            createdUsers.push(newUser);
            console.log(`   ✅ Created user: ${userData.username}`);
            
            // Create avatar
            const avatarConfig = sampleAvatarConfigs[i] || sampleAvatarConfigs[0];
            const avatar = new Avatar({
                userId: newUser._id,
                avaturnId: `avt_${userData.username}_${Date.now()}`,
                ...avatarConfig
            });
            await avatar.save();
            console.log(`   ✅ Created avatar for: ${userData.username}`);
            
            // Create voice profile (for some users)
            if (i < sampleVoiceCharacteristics.length) {
                const voiceCharacteristics = sampleVoiceCharacteristics[i];
                const voiceProfile = new VoiceProfile({
                    userId: newUser._id,
                    recordingUrl: `/uploads/voices/sample_${userData.username}.mp3`,
                    recordingDuration: 30,
                    recordingText: "This is a sample voice recording for Eternum.",
                    voiceCharacteristics,
                    isProcessed: true,
                    processingStatus: 'completed',
                    aiVoiceModelId: `vm_${newUser._id}_${Date.now()}`
                });
                await voiceProfile.save();
                console.log(`   ✅ Created voice profile for: ${userData.username}`);
            }
            
            // Create permissions
            const permissions = new Permission({
                userId: newUser._id,
                globalPermissions: {
                    profileVisibility: userData.settings.privacy,
                    directMessages: 'friends',
                    voiceChat: 'everyone',
                    locationSharing: 'friends'
                }
            });
            await permissions.save();
            console.log(`   ✅ Created permissions for: ${userData.username}`);
            
            // Create notifications
            const notifications = createSampleNotifications(newUser._id, i);
            await Notification.insertMany(notifications);
            console.log(`   ✅ Created ${notifications.length} notifications for: ${userData.username}`);
        }
        
        console.log('\n📊 Database seeding completed successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('   👤 Demo User (Premium):');
        console.log('      Email: demo@eternum.world');
        console.log('      Password: demo123456');
        console.log('      Level: 10, Coins: 2500');
        console.log('');
        console.log('   👤 Alice (Regular User):');
        console.log('      Email: alice@eternum.world');
        console.log('      Password: alice123456');
        console.log('      Level: 5, Coins: 1200');
        console.log('');
        console.log('   👤 Bob (Regular User):');
        console.log('      Email: bob@eternum.world');
        console.log('      Password: bob123456');
        console.log('      Level: 8, Coins: 1800');
        console.log('');
        console.log('   👤 Maria (Premium User):');
        console.log('      Email: maria@eternum.world');
        console.log('      Password: maria123456');
        console.log('      Level: 7, Coins: 1650');
        console.log('');
        console.log('   👤 Admin (Administrator):');
        console.log('      Email: admin@eternum.world');
        console.log('      Password: admin123456');
        console.log('      Level: 50, Coins: 10000');
        console.log('');
        
        // Display some statistics
        const userCount = await User.countDocuments();
        const avatarCount = await Avatar.countDocuments();
        const voiceCount = await VoiceProfile.countDocuments();
        const notificationCount = await Notification.countDocuments();
        
        console.log('📈 Database Statistics:');
        console.log(`   Users: ${userCount}`);
        console.log(`   Avatars: ${avatarCount}`);
        console.log(`   Voice Profiles: ${voiceCount}`);
        console.log(`   Notifications: ${notificationCount}`);
        
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        console.log('🎉 Seeding completed successfully!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

// Handle script termination
process.on('SIGINT', async () => {
    console.log('\n⏹️  Seeding interrupted');
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
    }
    process.exit(0);
});

// Run seeding
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };