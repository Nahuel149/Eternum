// scripts/test-connection.js - Test MongoDB Connection
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testConnection() {
    console.log('🔧 Testing MongoDB connection...\n');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eternum');
        console.log('✅ MongoDB connected successfully!');
        
        // Test collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`\n📦 Found ${collections.length} collections:`);
        collections.forEach(col => console.log(`   - ${col.name}`));
        
        // Test creating a sample user
        const User = require('../models/User');
        const testUser = await User.findOne({ email: 'test@eternum.world' });
        
        if (!testUser) {
            console.log('\n🧪 Creating test user...');
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('testpassword123', 10);
            
            const newTestUser = new User({
                email: 'test@eternum.world',
                username: 'test_user',
                fullName: 'Test User',
                password: hashedPassword,
                birthDate: new Date('1995-01-01'),
                zodiacSign: 'capricorn',
                age: 30,
                hobbies: ['gaming', 'technology'],
                customInterests: 'Testing the Eternum platform'
            });
            
            await newTestUser.save();
            console.log('✅ Test user created successfully!');
            console.log('   Email: test@eternum.world');
            console.log('   Password: testpassword123');
        } else {
            console.log('\n✅ Test user already exists');
        }
        
        // Close connection
        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
}

// Run test
testConnection();

// ===================================
// scripts/seed-data.js - Seed Sample Data
// ===================================
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

// Import models
const User = require('../models/User');
const Avatar = require('../models/Avatar');
const VoiceProfile = require('../models/VoiceProfile');
const Permission = require('../models/Permission');
const Notification = require('../models/Notification');

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eternum');
        console.log('✅ Connected to MongoDB');
        
        // Sample users data
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
                isPremium: true
            },
            {
                email: 'alice@eternum.world',
                username: 'alice_wonderland',
                fullName: 'Alice Johnson',
                password: 'alice123456',
                birthDate: new Date('1998-08-22'),
                zodiacSign: 'leo',
                age: 26,
                hobbies: ['fashion', 'dancing', 'photography'],
                customInterests: 'Fashion design and virtual photography',
                level: 5,
                memoryCoinBalance: 1200
            },
            {
                email: 'bob@eternum.world',
                username: 'bob_builder',
                fullName: 'Bob Smith',
                password: 'bob123456',
                birthDate: new Date('1985-12-10'),
                zodiacSign: 'sagittarius',
                age: 39,
                hobbies: ['sports', 'cooking', 'nature'],
                customInterests: 'Building virtual environments',
                level: 8,
                memoryCoinBalance: 1800
            }
        ];
        
        console.log('\n👥 Creating sample users...');
        
        for (const userData of sampleUsers) {
            // Check if user exists
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`   ⏭️  User ${userData.username} already exists`);
                continue;
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            userData.password = hashedPassword;
            
            // Create user
            const newUser = new User(userData);
            await newUser.save();
            console.log(`   ✅ Created user: ${userData.username}`);
            
            // Create avatar
            const avatar = new Avatar({
                userId: newUser._id,
                avaturnId: `avt_${userData.username}_${Date.now()}`,
                customization: {
                    clothing: {
                        head: 'none',
                        body: userData.isPremium ? 'premium_outfit' : 'starter_outfit',
                        feet: 'basic_shoes',
                        accessories: []
                    },
                    appearance: {
                        skinTone: 'medium',
                        hairStyle: 'modern',
                        hairColor: 'brown',
                        eyeColor: 'blue'
                    }
                }
            });
            await avatar.save();
            
            // Create permissions
            const permissions = new Permission({
                userId: newUser._id
            });
            await permissions.save();
            
            // Create welcome notification
            const notification = new Notification({
                userId: newUser._id,
                notificationId: `notif_${Date.now()}_welcome`,
                type: 'welcome',
                title: 'Welcome to Eternum!',
                message: 'Start your journey in the metaverse',
                priority: 'high'
            });
            await notification.save();
        }
        
        console.log('\n✅ Database seeding completed!');
        console.log('\n📝 Test Credentials:');
        console.log('   - demo@eternum.world / demo123456');
        console.log('   - alice@eternum.world / alice123456');
        console.log('   - bob@eternum.world / bob123456');
        
        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding
seedDatabase();