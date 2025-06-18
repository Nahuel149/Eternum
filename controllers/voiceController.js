// controllers/voiceController.js - Voice Controller
const VoiceProfile = require('../models/VoiceProfile');
const VoiceProcessor = require('../utils/voiceProcessor');

class VoiceController {
    // Get Voice Profile
    static async getVoiceProfile(req, res) {
        try {
            const voiceProfile = await VoiceProfile.findOne({ userId: req.params.userId });
            
            if (!voiceProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Voice profile not found'
                });
            }

            res.json({
                success: true,
                voiceProfile
            });

        } catch (error) {
            console.error('Get voice profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get voice profile',
                error: error.message
            });
        }
    }

    // Update Voice Profile
    static async updateVoiceProfile(req, res) {
        try {
            const allowedUpdates = [
                'voiceCharacteristics', 
                'generationSettings', 
                'customPresets', 
                'permissions'
            ];
            
            const updates = {};
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = req.body[key];
                }
            });

            const voiceProfile = await VoiceProfile.findOneAndUpdate(
                { userId: req.params.userId },
                updates,
                { new: true, runValidators: true }
            );

            if (!voiceProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Voice profile not found'
                });
            }

            res.json({
                success: true,
                message: 'Voice profile updated successfully',
                voiceProfile
            });

        } catch (error) {
            console.error('Update voice profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update voice profile',
                error: error.message
            });
        }
    }

    // Upload Voice Recording
    static async uploadVoiceRecording(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No voice recording uploaded'
                });
            }

            const voiceUrl = req.file.path; // Cloudinary URL handled in middleware
            const { text, duration } = req.body;

            let voiceProfile = await VoiceProfile.findOne({ userId: req.params.userId });

            if (!voiceProfile) {
                // Create new voice profile
                const voiceCharacteristics = await VoiceProcessor.analyzeVoice(voiceUrl);
                const aiVoiceModelId = await VoiceProcessor.generateVoiceModelId(req.params.userId, voiceCharacteristics);

                voiceProfile = new VoiceProfile({
                    userId: req.params.userId,
                    recordingUrl: voiceUrl,
                    recordingDuration: duration || 30,
                    recordingText: text || "Voice sample for Eternum",
                    voiceCharacteristics,
                    aiVoiceModelId,
                    processingStatus: 'pending'
                });

                await voiceProfile.save();

                // Queue voice processing
                await VoiceProcessor.queueVoiceProcessing(voiceProfile._id);

            } else {
                // Add as training data
                await voiceProfile.addTrainingData(
                    text || "Additional voice sample",
                    voiceUrl,
                    duration || 30,
                    0.8 // Quality score
                );
            }

            res.json({
                success: true,
                message: 'Voice recording uploaded successfully',
                voiceProfile: {
                    id: voiceProfile._id,
                    processingStatus: voiceProfile.processingStatus,
                    recordingUrl: voiceUrl
                }
            });

        } catch (error) {
            console.error('Upload voice recording error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload voice recording',
                error: error.message
            });
        }
    }

    // Generate Voice
    static async generateVoice(req, res) {
        try {
            const { text, options = {} } = req.body;

            if (!text) {
                return res.status(400).json({
                    success: false,
                    message: 'Text is required for voice generation'
                });
            }

            const voiceProfile = await VoiceProfile.findOne({ userId: req.params.userId });

            if (!voiceProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Voice profile not found'
                });
            }

            if (!voiceProfile.isProcessed) {
                return res.status(400).json({
                    success: false,
                    message: 'Voice profile is not yet processed. Please wait for processing to complete.'
                });
            }

            // Generate voice using the voice profile
            const generationResult = await voiceProfile.generateVoice(text, options);

            // In a real implementation, this would call an AI service
            const audioUrl = await VoiceProcessor.generateAudioFromText(
                text,
                voiceProfile.aiVoiceModelId,
                {
                    ...voiceProfile.generationSettings,
                    ...options
                }
            );

            res.json({
                success: true,
                message: 'Voice generated successfully',
                audioUrl,
                generationId: generationResult.id || `gen_${Date.now()}`,
                settings: generationResult.settings
            });

        } catch (error) {
            console.error('Generate voice error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate voice',
                error: error.message
            });
        }
    }

    // Get Processing Status
    static async getProcessingStatus(req, res) {
        try {
            const voiceProfile = await VoiceProfile.findOne({ userId: req.params.userId });

            if (!voiceProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Voice profile not found'
                });
            }

            res.json({
                success: true,
                status: {
                    processingStatus: voiceProfile.processingStatus,
                    isProcessed: voiceProfile.isProcessed,
                    processingProgress: voiceProfile.processingProgress,
                    qualityScore: voiceProfile.qualityScore,
                    totalTrainingTime: voiceProfile.totalTrainingTime,
                    error: voiceProfile.processingError
                }
            });

        } catch (error) {
            console.error('Get processing status error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get processing status',
                error: error.message
            });
        }
    }

    // Upload Voice Sample (for training)
    static async uploadVoiceSample(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No voice sample uploaded'
                });
            }

            const voiceUrl = req.file.path; // Cloudinary URL handled in middleware
            const { text, quality = 0.8 } = req.body;

            const voiceProfile = await VoiceProfile.findOne({ userId: req.params.userId });

            if (!voiceProfile) {
                return res.status(404).json({
                    success: false,
                    message: 'Voice profile not found'
                });
            }

            // Analyze the uploaded sample
            const duration = await VoiceProcessor.getAudioDuration(voiceUrl);
            
            // Add to training data
            await voiceProfile.addTrainingData(
                text || "Training sample",
                voiceUrl,
                duration,
                parseFloat(quality)
            );

            res.json({
                success: true,
                message: 'Voice sample added to training data',
                trainingDataCount: voiceProfile.trainingData.length,
                totalTrainingTime: voiceProfile.totalTrainingTime
            });

        } catch (error) {
            console.error('Upload voice sample error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload voice sample',
                error: error.message
            });
        }
    }

    // Clone Voice (AI Integration)
    static async cloneVoice(req, res) {
        try {
            const { sourceUserId, targetUserId, permissions } = req.body;

            // Check permissions
            const sourceVoice = await VoiceProfile.findOne({ userId: sourceUserId });
            
            if (!sourceVoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Source voice profile not found'
                });
            }

            if (!sourceVoice.permissions.allowVoiceCloning) {
                return res.status(403).json({
                    success: false,
                    message: 'Voice cloning not permitted for this user'
                });
            }

            // TODO: Implement actual voice cloning logic
            res.status(501).json({
                success: false,
                message: 'Voice cloning not implemented yet'
            });

        } catch (error) {
            console.error('Clone voice error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to clone voice',
                error: error.message
            });
        }
    }

    // Get Voice Models
    static async getVoiceModels(req, res) {
        try {
            const { language, accent, gender } = req.query;

            const query = {
                'permissions.allowPublicUse': true,
                isProcessed: true
            };

            if (language) {
                query['voiceCharacteristics.language'] = language;
            }

            if (accent) {
                query['voiceCharacteristics.accent'] = accent;
            }

            const voiceModels = await VoiceProfile.find(query)
                .populate('userId', 'username fullName')
                .select('voiceCharacteristics aiVoiceModelId stats userId')
                .limit(50);

            res.json({
                success: true,
                voiceModels: voiceModels.map(model => ({
                    id: model.aiVoiceModelId,
                    userId: model.userId,
                    characteristics: model.voiceCharacteristics,
                    qualityScore: model.qualityScore,
                    timesUsed: model.stats.timesUsed
                }))
            });

        } catch (error) {
            console.error('Get voice models error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get voice models',
                error: error.message
            });
        }
    }
}

module.exports = VoiceController;