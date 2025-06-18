// models/Avatar.js - Avatar Schema
const mongoose = require('mongoose');

const AvatarSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    avaturnId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatarUrl: String,
    glbFileUrl: String,
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    lastModified: { 
        type: Date, 
        default: Date.now 
    },
    customization: {
        clothing: {
            head: {
                type: String,
                default: 'none',
                enum: ['none', 'cap', 'hat', 'helmet', 'headband', 'crown', 'tech_visor']
            },
            body: {
                type: String,
                default: 'starter_outfit',
                enum: ['starter_outfit', 'casual_shirt', 'formal_suit', 'cyberpunk_jacket', 'hoodie', 'tank_top', 'dress', 'armor']
            },
            feet: {
                type: String,
                default: 'basic_shoes',
                enum: ['basic_shoes', 'sneakers', 'boots', 'sandals', 'heels', 'hover_boots', 'formal_shoes']
            },
            accessories: {
                type: [String],
                default: [],
                enum: ['glasses', 'necklace', 'watch', 'bracelet', 'earrings', 'ring', 'backpack', 'belt']
            }
        },
        appearance: {
            skinTone: {
                type: String,
                default: 'medium',
                enum: ['very_light', 'light', 'medium', 'tan', 'dark', 'very_dark']
            },
            hairStyle: {
                type: String,
                default: 'default',
                enum: ['default', 'short', 'long', 'curly', 'straight', 'wavy', 'braided', 'bald', 'modern_fade', 'pixie_cut']
            },
            hairColor: {
                type: String,
                default: 'brown',
                enum: ['black', 'brown', 'blonde', 'red', 'gray', 'white', 'blue', 'green', 'purple', 'pink']
            },
            eyeColor: {
                type: String,
                default: 'brown',
                enum: ['brown', 'blue', 'green', 'hazel', 'gray', 'amber', 'violet']
            },
            facialHair: {
                type: String,
                default: 'none',
                enum: ['none', 'mustache', 'beard', 'goatee', 'stubble', 'full_beard']
            },
            bodyType: {
                type: String,
                default: 'average',
                enum: ['slim', 'average', 'athletic', 'heavy']
            }
        },
        makeup: {
            enabled: { type: Boolean, default: false },
            style: {
                type: String,
                enum: ['natural', 'glamorous', 'dramatic', 'gothic', 'cyberpunk']
            },
            lipstick: String,
            eyeshadow: String,
            blush: String
        }
    },
    savedOutfits: [{
        name: {
            type: String,
            required: true,
            maxlength: 50
        },
        description: {
            type: String,
            maxlength: 200
        },
        items: {
            clothing: Object,
            appearance: Object,
            makeup: Object
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        tags: [String],
        createdAt: {
            type: Date,
            default: Date.now
        },
        timesUsed: {
            type: Number,
            default: 0
        }
    }],
    bodyLanguage: {
        eyeContact: { 
            type: Boolean, 
            default: true 
        },
        naturalMovement: { 
            type: Boolean, 
            default: true 
        },
        gestureIntensity: { 
            type: Number, 
            default: 0.8,
            min: 0,
            max: 1
        },
        walkingStyle: {
            type: String,
            default: 'normal',
            enum: ['slow', 'normal', 'fast', 'confident', 'casual', 'elegant']
        },
        posture: {
            type: String,
            default: 'neutral',
            enum: ['slouched', 'neutral', 'straight', 'confident', 'relaxed']
        }
    },
    voiceSettings: {
        lipSyncEnabled: { 
            type: Boolean, 
            default: true 
        },
        voiceModulation: { 
            type: String, 
            default: 'natural',
            enum: ['natural', 'robotic', 'deep', 'high', 'whisper', 'dramatic']
        },
        emotionDetection: { 
            type: Boolean, 
            default: true 
        },
        microphoneEnabled: { 
            type: Boolean, 
            default: true 
        },
        voiceVolume: {
            type: Number,
            default: 0.8,
            min: 0,
            max: 1
        }
    },
    gestureBindings: {
        wave: { 
            type: String, 
            default: 'gesture_social_001' 
        },
        dance1: {
            type: String,
            default: 'gesture_dance_basic'
        },
        dance2: String,
        dance3: String,
        celebration: String,
        greeting: String,
        goodbye: String,
        thinking: String,
        surprised: String,
        special: String,
        custom1: String,
        custom2: String,
        custom3: String
    },
    animations: {
        idleAnimation: {
            type: String,
            default: 'idle_natural'
        },
        walkAnimation: {
            type: String,
            default: 'walk_normal'
        },
        runAnimation: {
            type: String,
            default: 'run_normal'
        },
        jumpAnimation: {
            type: String,
            default: 'jump_basic'
        }
    },
    preferences: {
        autoEquipNewItems: {
            type: Boolean,
            default: false
        },
        saveOutfitOnChange: {
            type: Boolean,
            default: true
        },
        showClothingPreview: {
            type: Boolean,
            default: true
        },
        allowOthersToInspect: {
            type: Boolean,
            default: true
        }
    },
    stats: {
        timesCustomized: {
            type: Number,
            default: 0
        },
        favoriteOutfit: String,
        mostUsedItems: {
            type: Map,
            of: Number,
            default: new Map()
        },
        clothingItemsOwned: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total clothing items
AvatarSchema.virtual('totalClothingItems').get(function() {
    const clothing = this.customization.clothing;
    let count = 0;
    if (clothing.head !== 'none') count++;
    if (clothing.body !== 'starter_outfit') count++;
    if (clothing.feet !== 'basic_shoes') count++;
    count += clothing.accessories.length;
    return count;
});

// Virtual for customization completeness (percentage)
AvatarSchema.virtual('customizationCompleteness').get(function() {
    const totalFields = 8; // head, body, feet, accessories, hair, skin, eyes, etc.
    let completedFields = 0;
    
    const customization = this.customization;
    if (customization.clothing.head !== 'none') completedFields++;
    if (customization.clothing.body !== 'starter_outfit') completedFields++;
    if (customization.clothing.feet !== 'basic_shoes') completedFields++;
    if (customization.clothing.accessories.length > 0) completedFields++;
    if (customization.appearance.hairStyle !== 'default') completedFields++;
    if (customization.appearance.skinTone !== 'medium') completedFields++;
    if (customization.appearance.eyeColor !== 'brown') completedFields++;
    if (customization.appearance.hairColor !== 'brown') completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
});

// Index for better performance (userId and avaturnId already have unique indexes)
// AvatarSchema.index({ userId: 1 }); // Removed - already unique
// AvatarSchema.index({ avaturnId: 1 }); // Removed - already unique
AvatarSchema.index({ lastModified: -1 });
AvatarSchema.index({ 'savedOutfits.isPublic': 1 });

// Pre-save middleware to update lastModified
AvatarSchema.pre('save', function(next) {
    if (this.isModified('customization') || this.isModified('savedOutfits')) {
        this.lastModified = new Date();
        this.stats.timesCustomized += 1;
    }
    next();
});

module.exports = mongoose.model('Avatar', AvatarSchema);