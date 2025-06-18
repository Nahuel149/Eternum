// config/cloudinary.js - Cloudinary Configuration
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'de9qxtlpf',
    api_key: process.env.CLOUDINARY_API_KEY || '133734725324721',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'M0FrLyDW4L_6f51fCk2eB1NkE8E'
});

// Storage configuration for photos
const photoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'eternum/photos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
});

// Storage configuration for voice recordings
const voiceStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'eternum/voices',
        allowed_formats: ['mp3', 'wav', 'webm', 'm4a', 'ogg'],
        resource_type: 'video' // Use 'video' for audio files in Cloudinary
    }
});

// Storage configuration for avatars
const avatarStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'eternum/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'glb', 'gltf'],
        transformation: [
            { width: 1024, height: 1024, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'voiceRecording') {
        // Accept audio files
        if (file.mimetype.startsWith('audio/') || 
            ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed for voice recording'), false);
        }
    } else if (file.fieldname.includes('Photo')) {
        // Accept image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for photos'), false);
        }
    } else {
        // Default: accept all
        cb(null, true);
    }
};

// Create multer upload middleware with dynamic storage
const upload = multer({
    storage: multer.memoryStorage(), // We'll handle storage in the route
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit
    },
    fileFilter: fileFilter
});

// Upload functions for different file types
const uploadToCloudinary = async (file, folder = 'eternum/general') => {
    return new Promise((resolve, reject) => {
        // Determine resource type and format
        let resourceType = 'image';
        let format = null;
        
        if (file.mimetype.startsWith('audio/') || file.fieldname === 'voiceRecording') {
            resourceType = 'video'; // Cloudinary treats audio as video
            // Set format for audio files
            if (file.mimetype.includes('webm')) format = 'webm';
            else if (file.mimetype.includes('wav')) format = 'wav';
            else if (file.mimetype.includes('mp3')) format = 'mp3';
            else format = 'webm'; // Default for audio
        }
        
        const uploadOptions = {
            folder: folder,
            resource_type: resourceType,
            public_id: `${file.fieldname}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Add format for audio files
        if (resourceType === 'video' && format) {
            uploadOptions.format = format;
        }

        // Add transformations for images only
        if (resourceType === 'image') {
            uploadOptions.transformation = [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ];
        }

        console.log(`🔧 Upload options:`, {
            folder: uploadOptions.folder,
            resource_type: uploadOptions.resource_type,
            format: uploadOptions.format || 'auto',
            mimetype: file.mimetype
        });

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error(`❌ Cloudinary upload error:`, error.message);
                    reject(error);
                } else {
                    console.log(`✅ Cloudinary upload success:`, result.secure_url);
                    resolve(result);
                }
            }
        );

        uploadStream.end(file.buffer);
    });
};

module.exports = {
    cloudinary,
    photoStorage,
    voiceStorage,
    avatarStorage,
    upload,
    uploadToCloudinary
};