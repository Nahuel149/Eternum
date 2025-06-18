// controllers/avatarController.js - Avatar Controller
const Avatar = require('../models/Avatar');
const User = require('../models/User');

class AvatarController {
    // Get Avatar
    static async getAvatar(req, res) {
        try {
            const avatar = await Avatar.findOne({ userId: req.params.userId });
            
            if (!avatar) {
                return res.status(404).json({
                    success: false,
                    message: 'Avatar not found'
                });
            }

            res.json({
                success: true,
                avatar
            });

        } catch (error) {
            console.error('Get avatar error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get avatar',
                error: error.message
            });
        }
    }

    // Update Avatar
    static async updateAvatar(req, res) {
        try {
            const { customization, savedOutfits, bodyLanguage, voiceSettings, gestureBindings } = req.body;
            
            const avatar = await Avatar.findOneAndUpdate(
                { userId: req.params.userId },
                {
                    customization,
                    savedOutfits,
                    bodyLanguage,
                    voiceSettings,
                    gestureBindings,
                    lastModified: new Date()
                },
                { new: true, runValidators: true }
            );

            if (!avatar) {
                return res.status(404).json({
                    success: false,
                    message: 'Avatar not found'
                });
            }

            res.json({
                success: true,
                message: 'Avatar updated successfully',
                avatar
            });

        } catch (error) {
            console.error('Update avatar error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update avatar',
                error: error.message
            });
        }
    }

    // Save Outfit
    static async saveOutfit(req, res) {
        try {
            const { name, description, items, isPublic, tags } = req.body;
            
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Outfit name is required'
                });
            }

            const avatar = await Avatar.findOne({ userId: req.params.userId });
            
            if (!avatar) {
                return res.status(404).json({
                    success: false,
                    message: 'Avatar not found'
                });
            }

            const newOutfit = {
                name,
                description,
                items: items || avatar.customization,
                isPublic: isPublic || false,
                tags: tags || [],
                createdAt: new Date(),
                timesUsed: 0
            };

            avatar.savedOutfits.push(newOutfit);
            await avatar.save();

            res.json({
                success: true,
                message: 'Outfit saved successfully',
                outfit: newOutfit
            });

        } catch (error) {
            console.error('Save outfit error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save outfit',
                error: error.message
            });
        }
    }

    // Get Outfits
    static async getOutfits(req, res) {
        try {
            const avatar = await Avatar.findOne({ userId: req.params.userId });
            
            if (!avatar) {
                return res.status(404).json({
                    success: false,
                    message: 'Avatar not found'
                });
            }

            res.json({
                success: true,
                outfits: avatar.savedOutfits
            });

        } catch (error) {
            console.error('Get outfits error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get outfits',
                error: error.message
            });
        }
    }

    // Delete Outfit
    static async deleteOutfit(req, res) {
        try {
            const avatar = await Avatar.findOne({ userId: req.params.userId });
            
            if (!avatar) {
                return res.status(404).json({
                    success: false,
                    message: 'Avatar not found'
                });
            }

            avatar.savedOutfits = avatar.savedOutfits.filter(
                outfit => outfit._id.toString() !== req.params.outfitId
            );

            await avatar.save();

            res.json({
                success: true,
                message: 'Outfit deleted successfully'
            });

        } catch (error) {
            console.error('Delete outfit error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete outfit',
                error: error.message
            });
        }
    }

    // Upload Avatar File
    static async uploadAvatarFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const fileUrl = req.file.location || req.file.path;
            
            const avatar = await Avatar.findOneAndUpdate(
                { userId: req.params.userId },
                { 
                    avatarUrl: fileUrl,
                    glbFileUrl: fileUrl,
                    lastModified: new Date()
                },
                { new: true }
            );

            if (!avatar) {
                return res.status(404).json({
                    success: false,
                    message: 'Avatar not found'
                });
            }

            res.json({
                success: true,
                message: 'Avatar file uploaded successfully',
                avatarUrl: fileUrl
            });

        } catch (error) {
            console.error('Upload avatar file error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload avatar file',
                error: error.message
            });
        }
    }

    // Search Avatars
    static async searchAvatars(req, res) {
        try {
            const { query, category, limit = 20, page = 1 } = req.query;
            
            const searchCriteria = {};
            
            if (query) {
                // Search in outfit names and tags
                searchCriteria.$or = [
                    { 'savedOutfits.name': { $regex: query, $options: 'i' } },
                    { 'savedOutfits.tags': { $in: [new RegExp(query, 'i')] } }
                ];
            }

            if (category) {
                searchCriteria['savedOutfits.tags'] = category;
            }

            // Only show public outfits
            searchCriteria['savedOutfits.isPublic'] = true;

            const avatars = await Avatar.find(searchCriteria)
                .populate('userId', 'username fullName level')
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .sort({ 'savedOutfits.timesUsed': -1 });

            res.json({
                success: true,
                avatars: avatars.map(avatar => ({
                    userId: avatar.userId,
                    savedOutfits: avatar.savedOutfits.filter(outfit => outfit.isPublic)
                }))
            });

        } catch (error) {
            console.error('Search avatars error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to search avatars',
                error: error.message
            });
        }
    }

    // Get Popular Outfits
    static async getPopularOutfits(req, res) {
        try {
            const { limit = 20 } = req.query;

            const avatars = await Avatar.aggregate([
                { $unwind: '$savedOutfits' },
                { $match: { 'savedOutfits.isPublic': true } },
                { $sort: { 'savedOutfits.timesUsed': -1 } },
                { $limit: parseInt(limit) },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user',
                        pipeline: [{ $project: { username: 1, fullName: 1, level: 1 } }]
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        outfit: '$savedOutfits',
                        user: 1,
                        avatarId: '$_id'
                    }
                }
            ]);

            res.json({
                success: true,
                popularOutfits: avatars
            });

        } catch (error) {
            console.error('Get popular outfits error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get popular outfits',
                error: error.message
            });
        }
    }

    // Generate Avatar (AI Integration)
    static async generateAvatar(req, res) {
        try {
            // Placeholder for AI avatar generation
            res.status(501).json({
                success: false,
                message: 'AI avatar generation not implemented yet'
            });

        } catch (error) {
            console.error('Generate avatar error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate avatar',
                error: error.message
            });
        }
    }

    // Get Outfit Recommendations
    static async getOutfitRecommendations(req, res) {
        try {
            // Placeholder for AI outfit recommendations
            res.status(501).json({
                success: false,
                message: 'Outfit recommendations not implemented yet'
            });

        } catch (error) {
            console.error('Get outfit recommendations error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get recommendations',
                error: error.message
            });
        }
    }
}

module.exports = AvatarController;