// controllers/notificationController.js - Notification Controller
const Notification = require('../models/Notification');

class NotificationController {
    // Get Notifications
    static async getNotifications(req, res) {
        try {
            const { limit = 20, page = 1, category, unread } = req.query;
            
            const query = { 
                userId: req.params.userId,
                $or: [
                    { expiresAt: { $gt: new Date() } },
                    { expiresAt: null }
                ]
            };

            if (category) {
                query.category = category;
            }

            if (unread === 'true') {
                query.read = false;
            }

            const notifications = await Notification.find(query)
                .sort({ createdAt: -1, priority: -1 })
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));

            const total = await Notification.countDocuments(query);

            res.json({
                success: true,
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get notifications',
                error: error.message
            });
        }
    }

    // Mark Notification as Read
    static async markAsRead(req, res) {
        try {
            const notification = await Notification.findByIdAndUpdate(
                req.params.notificationId,
                { 
                    read: true,
                    readAt: new Date(),
                    'interactions.viewed': true,
                    'interactions.viewedAt': new Date()
                },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification marked as read',
                notification
            });

        } catch (error) {
            console.error('Mark notification as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: error.message
            });
        }
    }

    // Mark All Notifications as Read
    static async markAllAsRead(req, res) {
        try {
            const result = await Notification.updateMany(
                { 
                    userId: req.params.userId, 
                    read: false 
                },
                { 
                    read: true, 
                    readAt: new Date(),
                    'interactions.viewed': true,
                    'interactions.viewedAt': new Date()
                }
            );

            res.json({
                success: true,
                message: 'All notifications marked as read',
                modifiedCount: result.modifiedCount
            });

        } catch (error) {
            console.error('Mark all notifications as read error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read',
                error: error.message
            });
        }
    }

    // Delete Notification
    static async deleteNotification(req, res) {
        try {
            const notification = await Notification.findByIdAndDelete(req.params.notificationId);

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.json({
                success: true,
                message: 'Notification deleted successfully'
            });

        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message
            });
        }
    }

    // Get Unread Count
    static async getUnreadCount(req, res) {
        try {
            const count = await Notification.countDocuments({
                userId: req.params.userId,
                read: false,
                $or: [
                    { expiresAt: { $gt: new Date() } },
                    { expiresAt: null }
                ]
            });

            res.json({
                success: true,
                unreadCount: count
            });

        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get unread count',
                error: error.message
            });
        }
    }

    // Broadcast Notification (Admin)
    static async broadcastNotification(req, res) {
        try {
            const { 
                title, 
                message, 
                type = 'system_update', 
                priority = 'normal',
                targetUsers = 'all',
                category = 'system',
                actions = [],
                expiresIn = 30 // days
            } = req.body;

            if (!title || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Title and message are required'
                });
            }

            // TODO: Check if user has admin permissions
            // const hasAdminPermissions = await checkAdminPermissions(req.userId);
            // if (!hasAdminPermissions) {
            //     return res.status(403).json({
            //         success: false,
            //         message: 'Insufficient permissions'
            //     });
            // }

            // Get target users
            let targetUserIds = [];
            if (targetUsers === 'all') {
                const User = require('../models/User');
                const users = await User.find({ isActive: true }, '_id');
                targetUserIds = users.map(user => user._id);
            } else if (Array.isArray(targetUsers)) {
                targetUserIds = targetUsers;
            }

            // Create notifications for all target users
            const notifications = targetUserIds.map(userId => ({
                userId,
                notificationId: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type,
                title,
                message,
                priority,
                category,
                actions,
                expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
                appearance: {
                    icon: 'megaphone',
                    color: priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'blue'
                },
                metadata: {
                    source: 'admin_broadcast',
                    sentBy: req.userId
                }
            }));

            const createdNotifications = await Notification.insertMany(notifications);

            res.json({
                success: true,
                message: 'Broadcast notification sent successfully',
                targetCount: targetUserIds.length,
                createdCount: createdNotifications.length
            });

        } catch (error) {
            console.error('Broadcast notification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to broadcast notification',
                error: error.message
            });
        }
    }

    // Create Notification (Helper method)
    static async createNotification(userId, notificationData) {
        try {
            const notification = new Notification({
                userId,
                notificationId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...notificationData
            });

            await notification.save();
            return notification;

        } catch (error) {
            console.error('Create notification error:', error);
            throw error;
        }
    }

    // Send Friend Request Notification
    static async sendFriendRequestNotification(fromUserId, toUserId, fromUserName) {
        try {
            return await this.createNotification(toUserId, {
                type: 'friend_request',
                title: 'New Friend Request',
                message: `${fromUserName} wants to be your friend`,
                priority: 'normal',
                category: 'social',
                actionRequired: true,
                actions: [
                    {
                        type: 'api_call',
                        label: 'Accept',
                        endpoint: `/api/user/${toUserId}/friends/accept/${fromUserId}`,
                        method: 'PUT',
                        style: 'success'
                    },
                    {
                        type: 'api_call',
                        label: 'Decline',
                        endpoint: `/api/user/${toUserId}/friends/decline/${fromUserId}`,
                        method: 'DELETE',
                        style: 'secondary'
                    }
                ],
                relatedEntity: {
                    type: 'user',
                    id: fromUserId
                },
                appearance: {
                    icon: 'user-plus',
                    color: 'blue'
                }
            });

        } catch (error) {
            console.error('Send friend request notification error:', error);
            throw error;
        }
    }

    // Send Achievement Notification
    static async sendAchievementNotification(userId, achievementName, achievementDescription, memoryCoinReward = 0) {
        try {
            return await this.createNotification(userId, {
                type: 'achievement',
                title: 'Achievement Unlocked!',
                message: `You've earned "${achievementName}": ${achievementDescription}`,
                priority: 'high',
                category: 'achievement',
                actions: [
                    {
                        type: 'navigate',
                        label: 'View Achievements',
                        endpoint: '/achievements',
                        style: 'primary'
                    }
                ],
                appearance: {
                    icon: 'trophy',
                    color: 'yellow',
                    badge: {
                        text: memoryCoinReward > 0 ? `+${memoryCoinReward} MC` : 'New!',
                        color: 'gold'
                    }
                },
                metadata: {
                    source: 'achievement_system',
                    memoryCoinReward
                }
            });

        } catch (error) {
            console.error('Send achievement notification error:', error);
            throw error;
        }
    }

    // Send Level Up Notification
    static async sendLevelUpNotification(userId, newLevel, memoryCoinReward = 0) {
        try {
            return await this.createNotification(userId, {
                type: 'level_up',
                title: 'Level Up!',
                message: `Congratulations! You've reached level ${newLevel}!`,
                priority: 'high',
                category: 'achievement',
                actions: [
                    {
                        type: 'navigate',
                        label: 'View Profile',
                        endpoint: '/profile',
                        style: 'primary'
                    }
                ],
                appearance: {
                    icon: 'star',
                    color: 'purple',
                    badge: {
                        text: `Level ${newLevel}`,
                        color: 'purple'
                    }
                },
                metadata: {
                    source: 'level_system',
                    newLevel,
                    memoryCoinReward
                }
            });

        } catch (error) {
            console.error('Send level up notification error:', error);
            throw error;
        }
    }
}

module.exports = NotificationController;