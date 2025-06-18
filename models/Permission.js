// models/Permission.js - Permission Schema
const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    
    // Global Privacy Settings
    globalPermissions: {
        profileVisibility: { 
            type: String, 
            default: 'friends',
            enum: ['public', 'friends', 'private']
        },
        directMessages: { 
            type: String, 
            default: 'friends',
            enum: ['everyone', 'friends', 'none']
        },
        voiceChat: { 
            type: String, 
            default: 'everyone',
            enum: ['everyone', 'friends', 'none']
        },
        locationSharing: { 
            type: String, 
            default: 'friends',
            enum: ['everyone', 'friends', 'none']
        },
        memorySharing: { 
            type: String, 
            default: 'friends',
            enum: ['everyone', 'friends', 'none']
        },
        meetingInvites: { 
            type: String, 
            default: 'everyone',
            enum: ['everyone', 'friends', 'none']
        },
        friendRequests: {
            type: String,
            default: 'everyone',
            enum: ['everyone', 'friends_of_friends', 'none']
        },
        showOnlineStatus: {
            type: String,
            default: 'friends',
            enum: ['everyone', 'friends', 'none']
        },
        allowFollowers: {
            type: Boolean,
            default: true
        },
        showActivity: {
            type: String,
            default: 'friends',
            enum: ['everyone', 'friends', 'none']
        }
    },
    
    // Individual Friend Permissions (overrides global settings)
    friendPermissions: {
        type: Map,
        of: {
            canSeeProfile: { type: Boolean, default: true },
            canSendDM: { type: Boolean, default: true },
            canVoiceChat: { type: Boolean, default: true },
            canSeeLocation: { type: Boolean, default: true },
            canSeeMemories: { type: Boolean, default: true },
            canInviteToMeetings: { type: Boolean, default: true },
            canSeeOnlineStatus: { type: Boolean, default: true },
            canSeeActivity: { type: Boolean, default: true },
            notificationLevel: {
                type: String,
                enum: ['all', 'mentions_only', 'none'],
                default: 'all'
            },
            customNickname: String,
            relationship: {
                type: String,
                enum: ['friend', 'best_friend', 'family', 'colleague', 'acquaintance'],
                default: 'friend'
            }
        }
    },
    
    // Blocked Users
    blockedUsers: [{
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true
        },
        blockedAt: { 
            type: Date, 
            default: Date.now 
        },
        reason: {
            type: String,
            enum: ['harassment', 'spam', 'inappropriate_content', 'personal_conflict', 'other'],
            required: true
        },
        notes: {
            type: String,
            maxlength: 500
        },
        autoBlock: {
            type: Boolean,
            default: false
        }
    }],
    
    // Data Sharing Preferences
    dataSharing: {
        analytics: { 
            type: Boolean, 
            default: true 
        },
        aiTraining: { 
            type: Boolean, 
            default: true 
        },
        thirdParty: { 
            type: Boolean, 
            default: false 
        },
        marketing: {
            type: Boolean,
            default: false
        },
        research: {
            type: Boolean,
            default: true
        },
        personalization: {
            type: Boolean,
            default: true
        }
    },
    
    // Content Filters
    contentFilters: {
        matureContent: { 
            type: Boolean, 
            default: false 
        },
        violenceLevel: { 
            type: String, 
            default: 'low',
            enum: ['none', 'low', 'medium', 'high']
        },
        languageFilter: { 
            type: Boolean, 
            default: true 
        },
        suggestiveContent: {
            type: Boolean,
            default: false
        },
        gambling: {
            type: Boolean,
            default: false
        },
        userGeneratedContent: {
            type: String,
            default: 'filtered',
            enum: ['allow_all', 'filtered', 'friends_only', 'none']
        }
    },
    
    // Communication Preferences
    communicationSettings: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        pushNotifications: {
            type: Boolean,
            default: true
        },
        inAppNotifications: {
            type: Boolean,
            default: true
        },
        soundEffects: {
            type: Boolean,
            default: true
        },
        vibration: {
            type: Boolean,
            default: true
        },
        notificationTypes: {
            friendRequests: { type: Boolean, default: true },
            messages: { type: Boolean, default: true },
            meetingInvites: { type: Boolean, default: true },
            systemUpdates: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false },
            achievements: { type: Boolean, default: true },
            events: { type: Boolean, default: true }
        }
    },
    
    // Safety and Security
    securitySettings: {
        twoFactorAuth: {
            type: Boolean,
            default: false
        },
        loginNotifications: {
            type: Boolean,
            default: true
        },
        deviceTracking: {
            type: Boolean,
            default: true
        },
        locationHistory: {
            type: Boolean,
            default: false
        },
        passwordChangeNotification: {
            type: Boolean,
            default: true
        },
        suspiciousActivityAlerts: {
            type: Boolean,
            default: true
        }
    },
    
    // Avatar and Voice Permissions
    avatarPermissions: {
        allowOthersToInspect: {
            type: Boolean,
            default: true
        },
        allowOutfitCopying: {
            type: Boolean,
            default: false
        },
        showCustomizations: {
            type: Boolean,
            default: true
        },
        allowVoiceCloning: {
            type: Boolean,
            default: false
        },
        voiceRecordingConsent: {
            type: Boolean,
            default: false
        }
    },
    
    // Environment and World Permissions
    worldPermissions: {
        allowTeleportInvites: {
            type: Boolean,
            default: true
        },
        allowWorldCreation: {
            type: Boolean,
            default: true
        },
        allowWorldModeration: {
            type: Boolean,
            default: false
        },
        showVisitHistory: {
            type: String,
            default: 'friends',
            enum: ['everyone', 'friends', 'none']
        },
        allowScreenshots: {
            type: Boolean,
            default: true
        },
        allowRecording: {
            type: Boolean,
            default: false
        }
    },
    
    // Parental Controls (for users under 18 in some regions)
    parentalControls: {
        enabled: {
            type: Boolean,
            default: false
        },
        parentEmail: String,
        restrictedHours: {
            enabled: { type: Boolean, default: false },
            startTime: String, // "22:00"
            endTime: String,   // "06:00"
            timezone: String
        },
        allowedContacts: [{ 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }],
        contentRestrictions: {
            maxAge: { type: Number, default: 13 },
            allowedCategories: [String],
            blockedWords: [String]
        }
    },
    
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    },
    
    // Permission History (for audit trail)
    changeHistory: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for privacy level score
PermissionSchema.virtual('privacyScore').get(function() {
    let score = 0;
    const global = this.globalPermissions;
    
    // Calculate based on global settings (0-100)
    if (global.profileVisibility === 'private') score += 20;
    else if (global.profileVisibility === 'friends') score += 10;
    
    if (global.directMessages === 'none') score += 15;
    else if (global.directMessages === 'friends') score += 8;
    
    if (global.voiceChat === 'none') score += 15;
    else if (global.voiceChat === 'friends') score += 8;
    
    if (global.locationSharing === 'none') score += 20;
    else if (global.locationSharing === 'friends') score += 10;
    
    if (!this.dataSharing.thirdParty) score += 10;
    if (!this.dataSharing.marketing) score += 5;
    if (this.contentFilters.languageFilter) score += 5;
    if (this.securitySettings.twoFactorAuth) score += 2;
    
    return Math.min(score, 100);
});

// Virtual for blocked users count
PermissionSchema.virtual('blockedUsersCount').get(function() {
    return this.blockedUsers ? this.blockedUsers.length : 0;
});

// Index for better performance
PermissionSchema.index({ userId: 1 });
PermissionSchema.index({ 'globalPermissions.profileVisibility': 1 });
PermissionSchema.index({ 'blockedUsers.userId': 1 });
PermissionSchema.index({ 'dataSharing.thirdParty': 1 });

// Pre-save middleware to track changes
PermissionSchema.pre('save', function(next) {
    if (this.isModified()) {
        this.lastUpdated = new Date();
        
        // Track significant permission changes
        if (this.isModified('globalPermissions') || 
            this.isModified('dataSharing') || 
            this.isModified('securitySettings')) {
            
            // Add to change history (implement detailed tracking if needed)
            this.changeHistory.push({
                field: 'permissions_updated',
                oldValue: null,
                newValue: 'bulk_update',
                changedAt: new Date(),
                reason: 'user_settings_change'
            });
        }
    }
    next();
});

// Static methods
PermissionSchema.statics.getPublicProfiles = function() {
    return this.find({ 
        'globalPermissions.profileVisibility': 'public' 
    }).populate('userId', 'username fullName level');
};

PermissionSchema.statics.canUserContact = function(fromUserId, toUserId) {
    return this.findOne({ userId: toUserId }).then(permissions => {
        if (!permissions) return false;
        
        // Check if user is blocked
        const isBlocked = permissions.blockedUsers.some(
            blocked => blocked.userId.toString() === fromUserId.toString()
        );
        
        if (isBlocked) return false;
        
        // Check global permissions
        const dmSetting = permissions.globalPermissions.directMessages;
        if (dmSetting === 'none') return false;
        if (dmSetting === 'everyone') return true;
        
        // Check if they are friends (implement friend relationship check)
        return false; // Placeholder - implement friend check
    });
};

// Instance methods
PermissionSchema.methods.blockUser = function(userIdToBlock, reason = 'other', notes = '') {
    // Remove if already blocked
    this.blockedUsers = this.blockedUsers.filter(
        blocked => blocked.userId.toString() !== userIdToBlock.toString()
    );
    
    // Add new block
    this.blockedUsers.push({
        userId: userIdToBlock,
        reason,
        notes,
        blockedAt: new Date()
    });
    
    return this.save();
};

PermissionSchema.methods.unblockUser = function(userIdToUnblock) {
    this.blockedUsers = this.blockedUsers.filter(
        blocked => blocked.userId.toString() !== userIdToUnblock.toString()
    );
    
    return this.save();
};

PermissionSchema.methods.isBlocked = function(userId) {
    return this.blockedUsers.some(
        blocked => blocked.userId.toString() === userId.toString()
    );
};

PermissionSchema.methods.setFriendPermission = function(friendId, permissionKey, value) {
    if (!this.friendPermissions.has(friendId.toString())) {
        this.friendPermissions.set(friendId.toString(), {});
    }
    
    const friendPerms = this.friendPermissions.get(friendId.toString());
    friendPerms[permissionKey] = value;
    this.friendPermissions.set(friendId.toString(), friendPerms);
    
    return this.save();
};

module.exports = mongoose.model('Permission', PermissionSchema);