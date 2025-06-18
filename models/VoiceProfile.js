// models/VoiceProfile.js - Voice Profile Schema
const mongoose = require('mongoose');

const VoiceProfileSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true
    },
    recordingUrl: {
        type: String,
        required: true
    },
    recordingDuration: {
        type: Number,
        required: true,
        min: 1,
        max: 300 // 5 minutes max
    },
    recordingText: {
        type: String,
        maxlength: 1000
    },
    recordingDate: { 
        type: Date, 
        default: Date.now 
    },
    voiceCharacteristics: {
        pitch: {
            type: Number,
            min: 50,
            max: 400,
            default: 150
        },
        tone: {
            type: String,
            enum: ['warm', 'neutral', 'cheerful', 'confident', 'calm', 'energetic', 'serious', 'playful'],
            default: 'neutral'
        },
        accent: {
            type: String,
            enum: ['neutral', 'american', 'british', 'australian', 'canadian', 'irish', 'scottish', 'spanish', 'french', 'german', 'italian'],
            default: 'neutral'
        },
        language: {
            type: String,
            enum: ['en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN'],
            default: 'en-US'
        },
        speed: {
            type: String,
            enum: ['very_slow', 'slow', 'normal', 'fast', 'very_fast'],
            default: 'normal'
        },
        volume: {
            type: String,
            enum: ['very_quiet', 'quiet', 'normal', 'loud', 'very_loud'],
            default: 'normal'
        },
        emotionalRange: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.7
        },
        clarity: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.8
        }
    },
    isProcessed: { 
        type: Boolean, 
        default: false 
    },
    processingStatus: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    processingError: String,
    aiVoiceModelId: String,
    clonedVoiceUrl: String,
    
    // AI Service Integration
    aiServiceData: {
        elevenlabs: {
            voiceId: String,
            modelId: String,
            similarity: Number,
            stability: Number
        },
        murf: {
            voiceId: String,
            modelId: String
        },
        speechify: {
            voiceId: String,
            modelId: String
        },
        resemble: {
            voiceId: String,
            modelId: String
        }
    },
    
    // Voice Analysis Results
    analysisResults: {
        formants: {
            f1: Number,
            f2: Number,
            f3: Number
        },
        spectralFeatures: {
            spectralCentroid: Number,
            spectralBandwidth: Number,
            spectralRolloff: Number
        },
        prosodyFeatures: {
            intonationPattern: String,
            rhythmPattern: String,
            stressPattern: String
        },
        qualityMetrics: {
            noiseLevel: Number,
            signalToNoiseRatio: Number,
            voiceActivity: Number
        }
    },
    
    // Voice Generation Settings
    generationSettings: {
        naturalness: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.8
        },
        expressiveness: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.7
        },
        stability: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.6
        },
        similarity: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.8
        },
        style: {
            type: String,
            enum: ['conversational', 'narration', 'news', 'customer_service', 'gaming', 'audiobook'],
            default: 'conversational'
        }
    },
    
    // Usage Statistics
    stats: {
        timesUsed: {
            type: Number,
            default: 0
        },
        totalGeneratedAudio: {
            type: Number,
            default: 0 // in seconds
        },
        lastUsed: Date,
        averageGenerationTime: Number,
        successRate: {
            type: Number,
            min: 0,
            max: 1,
            default: 1
        }
    },
    
    // Training Data
    trainingData: [{
        text: String,
        audioUrl: String,
        duration: Number,
        quality: Number,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Voice Customization Presets
    customPresets: [{
        name: {
            type: String,
            required: true,
            maxlength: 50
        },
        description: {
            type: String,
            maxlength: 200
        },
        settings: {
            pitch: Number,
            speed: String,
            tone: String,
            volume: String,
            expressiveness: Number
        },
        isPublic: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        timesUsed: {
            type: Number,
            default: 0
        }
    }],
    
    // Voice Permissions
    permissions: {
        allowVoiceCloning: {
            type: Boolean,
            default: true
        },
        allowPublicUse: {
            type: Boolean,
            default: false
        },
        allowCommercialUse: {
            type: Boolean,
            default: false
        },
        allowAITraining: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for processing completion percentage
VoiceProfileSchema.virtual('processingProgress').get(function() {
    switch(this.processingStatus) {
        case 'pending': return 0;
        case 'processing': return 50;
        case 'completed': return 100;
        case 'failed': return 0;
        default: return 0;
    }
});

// Virtual for voice quality score
VoiceProfileSchema.virtual('qualityScore').get(function() {
    const analysis = this.analysisResults;
    if (!analysis || !analysis.qualityMetrics) return 0;
    
    const snr = analysis.qualityMetrics.signalToNoiseRatio || 0;
    const clarity = this.voiceCharacteristics.clarity || 0;
    const voiceActivity = analysis.qualityMetrics.voiceActivity || 0;
    
    return Math.round(((snr / 30) + clarity + voiceActivity) / 3 * 100);
});

// Virtual for total training time
VoiceProfileSchema.virtual('totalTrainingTime').get(function() {
    if (!this.trainingData || this.trainingData.length === 0) return 0;
    
    return this.trainingData.reduce((total, data) => total + (data.duration || 0), 0);
});

// Index for better performance (userId already has unique index)
// VoiceProfileSchema.index({ userId: 1 }); // Removed - already unique
VoiceProfileSchema.index({ processingStatus: 1 });
VoiceProfileSchema.index({ isProcessed: 1 });
VoiceProfileSchema.index({ 'voiceCharacteristics.language': 1 });
VoiceProfileSchema.index({ 'permissions.allowPublicUse': 1 });

// Pre-save middleware
VoiceProfileSchema.pre('save', function(next) {
    // Update processing timestamp
    if (this.isModified('processingStatus')) {
        if (this.processingStatus === 'completed') {
            this.isProcessed = true;
        }
    }
    
    // Update stats when voice is used
    if (this.isModified('stats.timesUsed')) {
        this.stats.lastUsed = new Date();
    }
    
    next();
});

// Static methods
VoiceProfileSchema.statics.findByLanguage = function(language) {
    return this.find({ 
        'voiceCharacteristics.language': language,
        'permissions.allowPublicUse': true,
        isProcessed: true
    });
};

VoiceProfileSchema.statics.findHighQuality = function(minQuality = 0.8) {
    return this.find({
        'analysisResults.qualityMetrics.signalToNoiseRatio': { $gte: minQuality * 30 },
        isProcessed: true
    });
};

// Instance methods
VoiceProfileSchema.methods.generateVoice = async function(text, options = {}) {
    if (!this.isProcessed) {
        throw new Error('Voice profile is not yet processed');
    }
    
    // Increment usage stats
    this.stats.timesUsed += 1;
    this.stats.lastUsed = new Date();
    
    await this.save();
    
    // Return voice generation request (implement with actual AI service)
    return {
        text,
        voiceId: this.aiVoiceModelId,
        settings: { ...this.generationSettings, ...options }
    };
};

VoiceProfileSchema.methods.addTrainingData = async function(text, audioUrl, duration, quality) {
    this.trainingData.push({
        text,
        audioUrl,
        duration,
        quality
    });
    
    // Trigger reprocessing if we have enough new data
    if (this.trainingData.length % 5 === 0) {
        this.processingStatus = 'pending';
        this.isProcessed = false;
    }
    
    await this.save();
};

module.exports = mongoose.model('VoiceProfile', VoiceProfileSchema);