// models/Notification.js - Notification Schema
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    notificationId: { 
        type: String, 
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'welcome',
            'friend_request',
            'friend_accepted',
            'message',
            'meeting_invite',
            'achievement',
            'level_up',
            'memory_coin_reward',
            'system_update',
            'maintenance',
            'promotion',
            'event_invitation',
            'world_invitation',
            'voice_processing_complete',
            'avatar_update',
            'security_alert',
            'payment_success',
            'payment_failed',
            'subscription_expiring',
            'content_moderation',
            'community_highlight'
        ]
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    priority: { 
        type: String, 
        default: 'low',
        enum: ['low', 'normal', 'high', 'urgent']
    },
    read: { 
        type: Boolean, 
        default: false 
    },
    readAt: Date,
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 }
    },
    actionRequired: { 
        type: Boolean, 
        default: false 
    },
    
    // Interactive Actions
    actions: [{
        type: {
            type: String,
            enum: ['navigate', 'api_call', 'external_link', 'modal', 'dismiss'],
            required: true
        },
        label: {
            type: String,
            required: true,
            maxlength: 50
        },
        endpoint: String,
        method: {
            type: String,
            enum: ['GET', 'POST', 'PUT', 'DELETE'],
            default: 'GET'
        },
        payload: mongoose.Schema.Types.Mixed,
        style: {
            type: String,
            enum: ['primary', 'secondary', 'success', 'warning', 'danger'],
            default: 'primary'
        },
        confirmation: {
            required: { type: Boolean, default: false },
            message: String
        }
    }],
    
    // Related Data
    relatedEntity: {
        type: {
            type: String,
            enum: ['user', 'avatar', 'voice', 'world', 'event', 'achievement', 'transaction', 'content']
        },
        id: mongoose.Schema.Types.ObjectId,
        data: mongoose.Schema.Types.Mixed
    },
    
    // Notification Appearance
    appearance: {
        icon: {
            type: String,
            default: 'notification'
        },
        color: {
            type: String,
            enum: ['blue', 'green', 'yellow', 'red', 'purple', 'orange', 'gray'],
            default: 'blue'
        },
        image: String,
        badge: {
            text: String,
            color: String
        }
    },
    
    // Delivery Settings
    delivery: {
        channels: {
            inApp: { type: Boolean, default: true },
            email: { type: Boolean, default: false },
            push: { type: Boolean, default: false },
            sms: { type: Boolean, default: false }
        },
        emailSent: { type: Boolean, default: false },
        pushSent: { type: Boolean, default: false },
        smsSent: { type: Boolean, default: false },
        deliveryAttempts: { type: Number, default: 0 },
        lastDeliveryAttempt: Date,
        deliveryErrors: [String]
    },
    
    // Interaction Tracking
    interactions: {
        viewed: { type: Boolean, default: false },
        viewedAt: Date,
        clicked: { type: Boolean, default: false },
        clickedAt: Date,
        actionTaken: String,
        actionTakenAt: Date,
        dismissed: { type: Boolean, default: false },
        dismissedAt: Date
    },
    
    // Grouping and Categorization
    category: {
        type: String,
        enum: ['social', 'system', 'achievement', 'commerce', 'security', 'content', 'event'],
        default: 'system'
    },
    tags: [String],
    groupId: String, // For grouping related notifications
    
    // Scheduling
    scheduledFor: Date,
    recurring: {
        enabled: { type: Boolean, default: false },
        pattern: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'custom']
        },
        interval: Number,
        endDate: Date,
        lastSent: Date
    },
    
    // A/B Testing
    variant: String,
    testGroup: String,
    
    // Metadata
    metadata: {
        source: String,
        campaign: String,
        experiment: String,
        version: { type: String, default: '1.0' },
        locale: { type: String, default: 'en' },
        platform: String,
        deviceType: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for time since creation
NotificationSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
});

// Virtual for urgency score
NotificationSchema.virtual('urgencyScore').get(function() {
    let score = 0;
    
    switch(this.priority) {
        case 'urgent': score += 40; break;
        case 'high': score += 30; break;
        case 'normal': score += 20; break;
        case 'low': score += 10; break;
    }
    
    if (this.actionRequired) score += 20;
    if (this.expiresAt && this.expiresAt < new Date(Date.now() + 24*60*60*1000)) score += 15;
    if (this.type === 'security_alert') score += 25;
    
    return Math.min(score, 100);
});

// Virtual for is expired
NotificationSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

// Index for better performance
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ scheduledFor: 1 });
NotificationSchema.index({ groupId: 1 });
NotificationSchema.index({ 'delivery.channels.email': 1 });
NotificationSchema.index({ 'delivery.channels.push': 1 });

// Pre-save middleware
NotificationSchema.pre('save', function(next) {
    // Set expiration date if not set
    if (!this.expiresAt) {
        const daysToExpire = this.priority === 'urgent' ? 7 : 
                           this.priority === 'high' ? 14 : 
                           this.priority === 'normal' ? 30 : 90;
        this.expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);
    }
    
    // Update read timestamp
    if (this.isModified('read') && this.read && !this.readAt) {
        this.readAt = new Date();
    }
    
    next();
});

// Static methods
NotificationSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({ 
        userId, 
        read: false,
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
        ]
    });
};

NotificationSchema.statics.markAllAsRead = function(userId) {
    return this.updateMany(
        { userId, read: false },
        { 
            read: true, 
            readAt: new Date(),
            'interactions.viewed': true,
            'interactions.viewedAt': new Date()
        }
    );
};

NotificationSchema.statics.deleteExpired = function() {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

NotificationSchema.statics.getByCategory = function(userId, category, limit = 20) {
    return this.find({ 
        userId, 
        category,
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
        ]
    })
    .sort({ createdAt: -1 })
    .limit(limit);
};

NotificationSchema.statics.createBulk = function(notifications) {
    return this.insertMany(notifications.map(notif => ({
        ...notif,
        notificationId: notif.notificationId || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })));
};

// Instance methods
NotificationSchema.methods.markAsRead = function() {
    this.read = true;
    this.readAt = new Date();
    this.interactions.viewed = true;
    this.interactions.viewedAt = new Date();
    return this.save();
};

NotificationSchema.methods.markAsClicked = function(actionTaken = null) {
    this.interactions.clicked = true;
    this.interactions.clickedAt = new Date();
    if (actionTaken) {
        this.interactions.actionTaken = actionTaken;
        this.interactions.actionTakenAt = new Date();
    }
    return this.save();
};

NotificationSchema.methods.dismiss = function() {
    this.interactions.dismissed = true;
    this.interactions.dismissedAt = new Date();
    this.read = true;
    this.readAt = new Date();
    return this.save();
};

NotificationSchema.methods.scheduleDelivery = function(channels = {}) {
    this.delivery.channels = { ...this.delivery.channels, ...channels };
    return this.save();
};

NotificationSchema.methods.recordDeliveryAttempt = function(channel, success, error = null) {
    this.delivery.deliveryAttempts += 1;
    this.delivery.lastDeliveryAttempt = new Date();
    
    if (success) {
        this.delivery[`${channel}Sent`] = true;
    } else if (error) {
        this.delivery.deliveryErrors.push(`${channel}: ${error}`);
    }
    
    return this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema);