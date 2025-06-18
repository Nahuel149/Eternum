// models/User.js - User Schema
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        unique: true, 
        required: true, 
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    username: { 
        type: String, 
        unique: true, 
        required: true,
        minlength: 3,
        maxlength: 20,
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    fullName: { 
        type: String, 
        required: true,
        maxlength: 100
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    birthDate: { 
        type: Date, 
        required: true 
    },
    zodiacSign: { 
        type: String, 
        required: true,
        enum: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
    },
    age: { 
        type: Number, 
        required: true,
        min: 18,
        max: 120
    },
    hobbies: {
        type: [String],
        default: []
    },
    customInterests: {
        type: String,
        maxlength: 500
    },
    profilePicture: String,
    joinDate: { 
        type: Date, 
        default: Date.now 
    },
    lastLogin: { 
        type: Date, 
        default: Date.now 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    isPremium: { 
        type: Boolean, 
        default: false 
    },
    level: { 
        type: Number, 
        default: 1,
        min: 1,
        max: 100
    },
    experience: { 
        type: Number, 
        default: 0,
        min: 0
    },
    memoryCoinBalance: { 
        type: Number, 
        default: 100,
        min: 0
    },
    roles: { 
        type: [String], 
        default: ['user'],
        enum: ['user', 'moderator', 'admin', 'premium', 'vip']
    },
    unlockedGestures: { 
        type: [String], 
        default: ['gesture_social_001'] 
    },
    ownedVehicles: { 
        type: [String], 
        default: [] 
    },
    attendedEvents: { 
        type: [String], 
        default: [] 
    },
    savedInformation: { 
        type: [Object], 
        default: [] 
    },
    avatarPhotos: {
        front: String,
        leftSide: String,
        rightSide: String
    },
    settings: {
        language: { 
            type: String, 
            default: 'en',
            enum: ['en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh']
        },
        notifications: { 
            type: Boolean, 
            default: true 
        },
        privacy: { 
            type: String, 
            default: 'friends',
            enum: ['public', 'friends', 'private']
        },
        voiceEnabled: { 
            type: Boolean, 
            default: true 
        },
        theme: {
            type: String,
            default: 'dark',
            enum: ['light', 'dark', 'auto']
        },
        autoSave: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        totalPlayTime: { 
            type: Number, 
            default: 0 
        },
        environmentsVisited: { 
            type: [String], 
            default: [] 
        },
        friendsCount: { 
            type: Number, 
            default: 0 
        },
        achievementsUnlocked: { 
            type: Number, 
            default: 0 
        },
        messagesExchanged: {
            type: Number,
            default: 0
        },
        eventsAttended: {
            type: Number,
            default: 0
        },
        memoriesCreated: {
            type: Number,
            default: 0
        }
    },
    socialConnections: {
        friends: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            addedAt: { type: Date, default: Date.now },
            closenessLevel: { type: Number, default: 1, min: 1, max: 5 }
        }],
        blocked: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            blockedAt: { type: Date, default: Date.now },
            reason: String
        }],
        pendingRequests: [{
            from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            sentAt: { type: Date, default: Date.now },
            message: String
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for age calculation
UserSchema.virtual('calculatedAge').get(function() {
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
});

// Virtual for experience to next level
UserSchema.virtual('experienceToNextLevel').get(function() {
    const experiencePerLevel = 1000;
    const currentLevelExp = (this.level - 1) * experiencePerLevel;
    const nextLevelExp = this.level * experiencePerLevel;
    return nextLevelExp - this.experience;
});

// Index for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ level: -1 });
UserSchema.index({ memoryCoinBalance: -1 });
UserSchema.index({ 'settings.privacy': 1 });
UserSchema.index({ isActive: 1 });

// Pre-save middleware to update age if birthDate changes
UserSchema.pre('save', function(next) {
    if (this.isModified('birthDate')) {
        this.age = this.calculatedAge;
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);