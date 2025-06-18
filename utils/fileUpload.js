// utils/fileUpload.js - File Upload Configuration
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// AWS S3 setup (optional)
let AWS, multerS3;
try {
    AWS = require('aws-sdk');
    multerS3 = require('multer-s3');
} catch (error) {
    console.log('AWS SDK not available, using local storage only');
}

// Configure AWS S3 (if available)
let s3;
if (AWS && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
    });
}

// Check if S3 is configured
const useS3 = s3 && process.env.AWS_S3_BUCKET;

// Ensure upload directories exist
const ensureUploadDirs = () => {
    const dirs = [
        'uploads',
        'uploads/avatars',
        'uploads/voices', 
        'uploads/photos',
        'uploads/documents',
        'uploads/temp'
    ];
    
    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Created directory: ${fullPath}`);
        }
    });
};

// Initialize upload directories
ensureUploadDirs();

// Local storage configuration
const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        
        // Determine upload path based on file field
        if (file.fieldname.includes('Photo') || file.fieldname.includes('photo')) {
            uploadPath += 'photos/';
        } else if (file.fieldname.includes('voice') || file.fieldname.includes('Voice')) {
            uploadPath += 'voices/';
        } else if (file.fieldname.includes('avatar') || file.fieldname.includes('Avatar')) {
            uploadPath += 'avatars/';
        } else if (file.fieldname.includes('document') || file.fieldname.includes('Document')) {
            uploadPath += 'documents/';
        } else {
            uploadPath += 'temp/';
        }
        
        // Ensure directory exists
        const fullPath = path.join(__dirname, '..', uploadPath);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, fileName);
    }
});

// S3 storage configuration (if available)
let s3Storage;
if (useS3 && multerS3) {
    s3Storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { 
                fieldName: file.fieldname,
                originalName: file.originalname,
                uploadedBy: req.userId || 'anonymous',
                uploadedAt: new Date().toISOString()
            });
        },
        key: function (req, file, cb) {
            let folder = 'misc/';
            
            // Determine S3 folder based on file field
            if (file.fieldname.includes('Photo') || file.fieldname.includes('photo')) {
                folder = 'photos/';
            } else if (file.fieldname.includes('voice') || file.fieldname.includes('Voice')) {
                folder = 'voices/';
            } else if (file.fieldname.includes('avatar') || file.fieldname.includes('Avatar')) {
                folder = 'avatars/';
            } else if (file.fieldname.includes('document') || file.fieldname.includes('Document')) {
                folder = 'documents/';
            }
            
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
            cb(null, folder + fileName);
        }
    });
}

// File filter function
const fileFilter = (req, file, cb) => {
    try {
        const allowedTypes = {
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/mp4', 'audio/aac'],
            documents: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            models: ['model/gltf-binary', 'application/octet-stream', 'model/gltf+json']
        };
        
        // Check file type based on field name
        if (file.fieldname.includes('Photo') || file.fieldname.includes('photo')) {
            if (allowedTypes.images.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed for photos'));
            }
        } else if (file.fieldname.includes('voice') || file.fieldname.includes('Voice')) {
            if (allowedTypes.audio.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only audio files (MP3, WAV, OGG, AAC) are allowed for voice recordings'));
            }
        } else if (file.fieldname.includes('avatar') || file.fieldname.includes('Avatar')) {
            if (allowedTypes.models.includes(file.mimetype) || allowedTypes.images.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only 3D model files (GLB, GLTF) or image files are allowed for avatars'));
            }
        } else if (file.fieldname.includes('document') || file.fieldname.includes('Document')) {
            if (allowedTypes.documents.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only document files (PDF, TXT, DOC, DOCX) are allowed'));
            }
        } else {
            // Default: allow common file types
            const allAllowed = [
                ...allowedTypes.images,
                ...allowedTypes.audio,
                ...allowedTypes.documents,
                ...allowedTypes.models
            ];
            
            if (allAllowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`File type ${file.mimetype} is not allowed`));
            }
        }
    } catch (error) {
        cb(new Error('Error validating file type'));
    }
};

// File size limits (in bytes)
const getFileSizeLimit = (fieldname) => {
    if (fieldname.includes('voice') || fieldname.includes('Voice')) {
        return 50 * 1024 * 1024; // 50MB for voice files
    } else if (fieldname.includes('avatar') || fieldname.includes('Avatar')) {
        return 100 * 1024 * 1024; // 100MB for avatar files
    } else if (fieldname.includes('Photo') || fieldname.includes('photo')) {
        return 10 * 1024 * 1024; // 10MB for photos
    } else if (fieldname.includes('document') || fieldname.includes('Document')) {
        return 25 * 1024 * 1024; // 25MB for documents
    } else {
        return 25 * 1024 * 1024; // 25MB default
    }
};

// Create multer instance
const upload = multer({
    storage: useS3 ? s3Storage : localStorage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
        files: 10, // Maximum 10 files per request
        fields: 20 // Maximum 20 form fields
    },
    fileFilter: fileFilter
});

// Custom upload middleware with dynamic size limits
const createUploadMiddleware = (fieldConfig) => {
    return (req, res, next) => {
        // Create a custom multer instance with specific limits
        const customUpload = multer({
            storage: useS3 ? s3Storage : localStorage,
            limits: {
                fileSize: getFileSizeLimit(fieldConfig.name || ''),
                files: fieldConfig.maxCount || 1,
                fields: 20
            },
            fileFilter: fileFilter
        });

        // Use the appropriate multer method based on field configuration
        let uploadMethod;
        if (Array.isArray(fieldConfig)) {
            uploadMethod = customUpload.fields(fieldConfig);
        } else if (fieldConfig.maxCount > 1) {
            uploadMethod = customUpload.array(fieldConfig.name, fieldConfig.maxCount);
        } else {
            uploadMethod = customUpload.single(fieldConfig.name);
        }

        uploadMethod(req, res, next);
    };
};

// Utility functions
const getFileUrl = (file) => {
    if (useS3 && file.location) {
        return file.location;
    } else if (file.path) {
        return `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${path.basename(file.path)}`;
    } else {
        return null;
    }
};

const deleteFile = async (filePath) => {
    try {
        if (useS3) {
            // Extract key from S3 URL
            const key = filePath.split('/').slice(-2).join('/'); // Get last two parts for folder/filename
            await s3.deleteObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key
            }).promise();
        } else {
            // Delete local file
            const localPath = path.join(__dirname, '..', 'uploads', path.basename(filePath));
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

const getFileInfo = async (filePath) => {
    try {
        if (useS3) {
            const key = filePath.split('/').slice(-2).join('/');
            const metadata = await s3.headObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key
            }).promise();
            
            return {
                size: metadata.ContentLength,
                lastModified: metadata.LastModified,
                contentType: metadata.ContentType,
                metadata: metadata.Metadata
            };
        } else {
            const localPath = path.join(__dirname, '..', 'uploads', path.basename(filePath));
            const stats = fs.statSync(localPath);
            
            return {
                size: stats.size,
                lastModified: stats.mtime,
                contentType: null, // Would need additional logic to determine
                metadata: {}
            };
        }
    } catch (error) {
        console.error('Error getting file info:', error);
        return null;
    }
};

// Health check for file storage
const healthCheck = async () => {
    try {
        if (useS3) {
            // Test S3 connection
            await s3.listObjectsV2({
                Bucket: process.env.AWS_S3_BUCKET,
                MaxKeys: 1
            }).promise();
            
            return { storage: 'S3', status: 'healthy' };
        } else {
            // Test local storage
            const testPath = path.join(__dirname, '..', 'uploads');
            fs.accessSync(testPath, fs.constants.W_OK);
            
            return { storage: 'Local', status: 'healthy' };
        }
    } catch (error) {
        return { storage: useS3 ? 'S3' : 'Local', status: 'unhealthy', error: error.message };
    }
};

module.exports = {
    upload,
    createUploadMiddleware,
    useS3,
    getFileUrl,
    deleteFile,
    getFileInfo,
    healthCheck,
    ensureUploadDirs
};