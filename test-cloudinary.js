// test-cloudinary.js - Test Cloudinary Integration
const FormData = require('form-data');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');

async function testCloudinaryUpload() {
    try {
        console.log('☁️  Testing Cloudinary Integration with Registration...\n');
        
        // Create FormData like the frontend does
        const formData = new FormData();
        
        // Step 1 data
        formData.append('email', 'cloudinary@test.com');
        formData.append('username', 'cloudinaryuser');
        formData.append('fullName', 'Cloudinary Test User');
        formData.append('password', 'cloud123');
        
        // Step 2 data
        formData.append('birthDate', '1990-01-01');
        formData.append('zodiacSign', 'capricorn');
        formData.append('age', '34');
        
        // Step 3 data
        formData.append('hobbies', JSON.stringify(['gaming', 'music', 'photography']));
        formData.append('customInterests', 'Cloud storage, image optimization, and CDN delivery');
        
        // Create test files
        const testAudio = Buffer.from('fake-audio-data-for-cloudinary-test');
        formData.append('voiceRecording', testAudio, {
            filename: 'test-voice-cloudinary.webm',
            contentType: 'audio/webm'
        });
        
        const testImage = Buffer.from('fake-image-data-for-cloudinary-test');
        formData.append('frontPhoto', testImage, {
            filename: 'test-front-photo.jpg',
            contentType: 'image/jpeg'
        });
        
        console.log('📤 Sending registration with file uploads to Cloudinary...');
        
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        console.log('\n📨 Server Response:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Success: ${result.success ? '✅' : '❌'}`);
        console.log(`Message: ${result.message}`);
        
        if (result.success) {
            console.log('\n👤 User Data:');
            console.log(`   ID: ${result.user.id}`);
            console.log(`   Username: ${result.user.username}`);
            console.log(`   Email: ${result.user.email}`);
            
            // Now verify Cloudinary URLs were saved
            console.log('\n☁️  Verifying Cloudinary URLs in database...');
            await verifyCloudinaryUrls(result.user.id);
            
        } else {
            console.log(`❌ Error: ${result.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('❌ Cloudinary test failed:', error.message);
    }
}

async function verifyCloudinaryUrls(userId) {
    const mongoose = require('mongoose');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const User = require('./models/User');
        const VoiceProfile = require('./models/VoiceProfile');
        
        const user = await User.findById(userId);
        const voiceProfile = await VoiceProfile.findOne({ userId });
        
        console.log('\n☁️  Cloudinary URL Verification:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (user && user.avatarPhotos) {
            console.log(`   📸 Front Photo: ${user.avatarPhotos.front ? '✅ Cloudinary URL' : '❌ Missing'}`);
            if (user.avatarPhotos.front) {
                console.log(`      URL: ${user.avatarPhotos.front}`);
            }
        }
        
        if (voiceProfile) {
            console.log(`   🎤 Voice Recording: ${voiceProfile.recordingUrl ? '✅ Cloudinary URL' : '❌ Missing'}`);
            if (voiceProfile.recordingUrl) {
                console.log(`      URL: ${voiceProfile.recordingUrl}`);
            }
        }
        
        console.log('\n🎉 CLOUDINARY INTEGRATION TEST COMPLETE!');
        
        await mongoose.connection.close();
        
    } catch (error) {
        console.error('❌ Database verification failed:', error.message);
    }
}

// Run the test
require('dotenv').config();
testCloudinaryUpload();